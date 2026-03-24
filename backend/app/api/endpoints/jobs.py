from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.jobs import JobsResponse
from app.services.jobs_service import JobsService

router = APIRouter()


@router.get("/search", response_model=JobsResponse)
async def search_jobs(
    q: str = Query(..., min_length=1, description="Job search query"),
    location: str | None = Query(None, description="Location filter"),
    employment_type: str | None = Query(None, description="full-time, part-time, internship, contract"),
    remote_only: bool = Query(False, description="Only show remote jobs"),
    page: int = Query(1, ge=1, description="Page number"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not user.is_premium:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "premium_required",
                "message": "Job Board is a premium feature.",
                "upgrade_url": "/pricing",
            },
        )

    return await JobsService.search(
        query=q,
        location=location,
        employment_type=employment_type,
        remote_only=remote_only,
        page=page,
    )
