import secrets
from datetime import datetime, timedelta, timezone

import httpx
import jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.user import User
from app.schemas.auth import AuthResponse, OAuthRedirectResponse, UserResponse

_oauth_states: dict[str, float] = {}


class AuthService:
    @staticmethod
    def _generate_state(provider: str) -> str:
        state = secrets.token_urlsafe(32)
        _oauth_states[state] = {
            "expires_at": datetime.now(timezone.utc).timestamp() + 600,
            "provider": provider,
        }
        return state

    @staticmethod
    def _verify_state(state: str, provider: str) -> bool:
        data = _oauth_states.pop(state, None)
        if data is None:
            return False
        if data["provider"] != provider:
            # Put it back — wrong provider
            _oauth_states[state] = data
            return False
        return datetime.now(timezone.utc).timestamp() < data["expires_at"]

    @staticmethod
    def _create_jwt(user: User) -> str:
        payload = {
            "user_id": str(user.id),
            "exp": datetime.now(timezone.utc) + timedelta(days=settings.jwt_expiry_days),
            "iat": datetime.now(timezone.utc),
        }
        return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)

    @staticmethod
    def get_github_redirect_url() -> OAuthRedirectResponse:
        state = AuthService._generate_state("github")
        url = (
            f"https://github.com/login/oauth/authorize"
            f"?client_id={settings.github_client_id}"
            f"&scope=read:user,user:email"
            f"&state={state}"
            f"&redirect_uri={settings.github_redirect_uri}"
        )
        return OAuthRedirectResponse(redirect_url=url)

    @staticmethod
    def get_google_redirect_url() -> OAuthRedirectResponse:
        state = AuthService._generate_state("google")
        url = (
            f"https://accounts.google.com/o/oauth2/v2/auth"
            f"?client_id={settings.google_client_id}"
            f"&response_type=code"
            f"&scope=openid+email+profile"
            f"&state={state}"
            f"&redirect_uri={settings.google_redirect_uri}"
        )
        return OAuthRedirectResponse(redirect_url=url)

    @staticmethod
    async def handle_github_callback(
        db: AsyncSession, code: str, state: str
    ) -> AuthResponse:
        if not AuthService._verify_state(state, "github"):
            from fastapi import HTTPException
            raise HTTPException(status_code=403, detail="Invalid OAuth state")

        async with httpx.AsyncClient() as client:
            token_resp = await client.post(
                "https://github.com/login/oauth/access_token",
                json={
                    "client_id": settings.github_client_id,
                    "client_secret": settings.github_client_secret,
                    "code": code,
                },
                headers={"Accept": "application/json"},
            )
            token_data = token_resp.json()
            access_token = token_data["access_token"]

            user_resp = await client.get(
                "https://api.github.com/user",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            github_user = user_resp.json()

            email_resp = await client.get(
                "https://api.github.com/user/emails",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            emails = email_resp.json()
            primary_email = next(
                (e["email"] for e in emails if e.get("primary")),
                github_user.get("email", f"{github_user['login']}@users.noreply.github.com"),
            )

        return await AuthService._upsert_user(
            db,
            provider="github",
            provider_id=str(github_user["id"]),
            email=primary_email,
            display_name=github_user.get("name") or github_user["login"],
            avatar_url=github_user.get("avatar_url"),
            github_username=github_user["login"],
        )

    @staticmethod
    async def handle_google_callback(
        db: AsyncSession, code: str, state: str
    ) -> AuthResponse:
        if not AuthService._verify_state(state, "google"):
            from fastapi import HTTPException
            raise HTTPException(status_code=403, detail="Invalid OAuth state")

        async with httpx.AsyncClient() as client:
            token_resp = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": settings.google_redirect_uri,
                },
            )
            token_data = token_resp.json()
            access_token = token_data["access_token"]

            userinfo_resp = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            google_user = userinfo_resp.json()

        return await AuthService._upsert_user(
            db,
            provider="google",
            provider_id=google_user["id"],
            email=google_user["email"],
            display_name=google_user.get("name"),
            avatar_url=google_user.get("picture"),
            github_username=None,
        )

    @staticmethod
    async def _upsert_user(
        db: AsyncSession,
        provider: str,
        provider_id: str,
        email: str,
        display_name: str | None,
        avatar_url: str | None,
        github_username: str | None,
    ) -> AuthResponse:
        result = await db.execute(
            select(User).where(
                User.auth_provider == provider,
                User.provider_id == provider_id,
            )
        )
        user = result.scalar_one_or_none()

        if user:
            user.email = email
            user.display_name = display_name
            user.avatar_url = avatar_url
            if github_username:
                user.github_username = github_username
        else:
            user = User(
                email=email,
                display_name=display_name,
                avatar_url=avatar_url,
                github_username=github_username,
                auth_provider=provider,
                provider_id=provider_id,
                credits_remaining=settings.free_credits,
            )
            db.add(user)

        await db.commit()
        await db.refresh(user)

        token = AuthService._create_jwt(user)
        return AuthResponse(
            access_token=token,
            user=UserResponse.model_validate(user),
        )
