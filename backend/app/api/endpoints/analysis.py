from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.analysis import AnalysisResponse, AnalyzeRequest, NoCreditsResponse
from app.services.analysis_service import AnalysisService

router = APIRouter()


@router.post(
    "/analyze",
    response_model=AnalysisResponse,
    responses={402: {"model": NoCreditsResponse}},
)
async def analyze_github_profile(
    body: AnalyzeRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not user.is_premium and user.credits_remaining <= 0:
        raise HTTPException(
            status_code=402,
            detail={
                "error": "no_credits",
                "message": "You've used all 2 free analyses.",
                "upgrade_url": "/pricing",
            },
        )

    result = await AnalysisService.analyze(db, user, body.github_username)
    return result


@router.get("/analysis/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(
    analysis_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await AnalysisService.get_by_id(db, user, analysis_id)
    if not result:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return result
