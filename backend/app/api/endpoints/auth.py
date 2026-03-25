from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.auth import (
    AuthResponse,
    OAuthCallbackRequest,
    OAuthRedirectResponse,
    UserResponse,
)
from app.services.auth_service import AuthService

router = APIRouter()

# Determine if running in production (HTTPS)
_is_production = settings.frontend_url.startswith("https://")
# Extract root domain for cross-subdomain cookies (e.g., ".techgenie.cc")
_cookie_domain = None
if _is_production:
    from urllib.parse import urlparse
    _parsed = urlparse(settings.frontend_url)
    _cookie_domain = f".{_parsed.hostname}"


def _set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key="token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=_is_production,
        domain=_cookie_domain,
        max_age=7 * 24 * 3600,
    )


@router.get("/github", response_model=OAuthRedirectResponse)
async def github_oauth_redirect():
    return AuthService.get_github_redirect_url()


@router.post("/github/callback", response_model=AuthResponse)
async def github_oauth_callback(
    body: OAuthCallbackRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    auth_response = await AuthService.handle_github_callback(db, body.code, body.state)
    _set_auth_cookie(response, auth_response.access_token)
    return auth_response


@router.get("/google", response_model=OAuthRedirectResponse)
async def google_oauth_redirect():
    return AuthService.get_google_redirect_url()


@router.post("/google/callback", response_model=AuthResponse)
async def google_oauth_callback(
    body: OAuthCallbackRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    auth_response = await AuthService.handle_google_callback(db, body.code, body.state)
    _set_auth_cookie(response, auth_response.access_token)
    return auth_response


@router.get("/me", response_model=UserResponse)
async def get_current_user_endpoint(user: User = Depends(get_current_user)):
    return UserResponse.model_validate(user)


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("token", domain=_cookie_domain)
    return {"message": "Logged out"}
