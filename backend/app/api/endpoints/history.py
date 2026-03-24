from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.history import HistoryResponse
from app.services.history_service import HistoryService

router = APIRouter()


@router.get("", response_model=HistoryResponse)
async def get_history(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    analyses = await HistoryService.get_user_history(db, user.id)
    return HistoryResponse(analyses=analyses)


@router.delete("/{analysis_id}")
async def delete_history_item(
    analysis_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    deleted = await HistoryService.delete_user_analysis(db, user.id, analysis_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return {"message": "Deleted"}
