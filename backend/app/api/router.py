from fastapi import APIRouter

from app.api.endpoints import (
    health, auth, analysis, history, billing, resume,
    compare, cover_letter, skill_gap, news, linkedin, jobs,
)

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(analysis.router, tags=["analysis"])
api_router.include_router(history.router, prefix="/history", tags=["history"])
api_router.include_router(billing.router, prefix="/billing", tags=["billing"])
api_router.include_router(resume.router, prefix="/resume", tags=["resume"])
api_router.include_router(compare.router, prefix="/compare", tags=["compare"])
api_router.include_router(cover_letter.router, prefix="/cover-letter", tags=["cover-letter"])
api_router.include_router(skill_gap.router, prefix="/skill-gap", tags=["skill-gap"])
api_router.include_router(news.router, prefix="/news", tags=["news"])
api_router.include_router(linkedin.router, prefix="/linkedin", tags=["linkedin"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
