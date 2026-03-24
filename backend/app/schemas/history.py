from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.schemas.analysis import ScoresResponse


class HistoryItem(BaseModel):
    id: UUID
    github_username: str
    avatar_url: str | None
    score_overall: float
    scores: ScoresResponse
    created_at: datetime


class HistoryResponse(BaseModel):
    analyses: list[HistoryItem]
