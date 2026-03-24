from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.analysis import NoCreditsResponse
from app.schemas.skill_gap import SkillGapRequest, SkillGapResponse
from app.services.skill_gap_service import SkillGapService

router = APIRouter()


@router.post(
    "/analyze",
    response_model=SkillGapResponse,
    responses={402: {"model": NoCreditsResponse}},
)
async def analyze_skill_gap(
    body: SkillGapRequest,
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

    return await SkillGapService.analyze(
        db=db,
        user=user,
        job_description=body.job_description,
        github_username=body.github_username,
        resume_text=body.resume_text,
    )
