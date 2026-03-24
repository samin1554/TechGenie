from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

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
    response.set_cookie(
        key="token",
        value=auth_response.access_token,
        httponly=True,
        samesite="lax",
        max_age=7 * 24 * 3600,
    )
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
    response.set_cookie(
        key="token",
        value=auth_response.access_token,
        httponly=True,
        samesite="lax",
        max_age=7 * 24 * 3600,
    )
    return auth_response


@router.get("/me", response_model=UserResponse)
async def get_current_user_endpoint(user: User = Depends(get_current_user)):
    return UserResponse.model_validate(user)


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("token")
    return {"message": "Logged out"}
