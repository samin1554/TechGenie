from uuid import UUID

from pydantic import BaseModel


class OAuthRedirectResponse(BaseModel):
    redirect_url: str


class OAuthCallbackRequest(BaseModel):
    code: str
    state: str


class UserResponse(BaseModel):
    id: UUID
    email: str
    display_name: str | None
    avatar_url: str | None
    github_username: str | None
    credits_remaining: int
    is_premium: bool

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    access_token: str
    user: UserResponse
