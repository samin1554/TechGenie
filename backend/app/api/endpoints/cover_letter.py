from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.analysis import NoCreditsResponse
from app.schemas.cover_letter import CoverLetterRequest, CoverLetterResponse
from app.services.cover_letter_service import CoverLetterService

router = APIRouter()


@router.post(
    "/generate",
    response_model=CoverLetterResponse,
    responses={402: {"model": NoCreditsResponse}},
)
async def generate_cover_letter(
    body: CoverLetterRequest,
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

    return await CoverLetterService.generate(
        db=db,
        user=user,
        job_description=body.job_description,
        resume_text=body.resume_text,
        github_username=body.github_username,
    )
