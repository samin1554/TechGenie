from fastapi import APIRouter

from app.schemas.news import Editorial, EditorialsResponse
from app.services.news_service import NewsService

router = APIRouter()


@router.get("/editorials", response_model=EditorialsResponse)
async def get_editorials():
    """Public endpoint — no auth required. Returns daily tech editorials."""
    data = await NewsService.get_editorials()
    return EditorialsResponse(
        editorials=[Editorial(**e) for e in data["editorials"]],
        ticker=data["ticker"],
    )
