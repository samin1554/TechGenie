from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.analysis import NoCreditsResponse
from app.schemas.linkedin import LinkedInOptimizeRequest, LinkedInOptimizeResponse
from app.services.linkedin_service import LinkedInService

router = APIRouter()


@router.post(
    "/optimize",
    response_model=LinkedInOptimizeResponse,
    responses={402: {"model": NoCreditsResponse}},
)
async def optimize_linkedin(
    body: LinkedInOptimizeRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not user.is_premium and user.credits_remaining <= 0:
        raise HTTPException(
            status_code=402,
            detail={
                "error": "no_credits",
                "message": "You've used all your free credits.",
                "upgrade_url": "/pricing",
            },
        )

    return await LinkedInService.optimize(
        db=db,
        user=user,
        headline=body.headline,
        about=body.about,
        target_role=body.target_role,
        github_username=body.github_username,
    )
