from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    github_username: str = Field(..., min_length=1, max_length=39)


class ScoresResponse(BaseModel):
    overall: float
    project_diversity: float
    language_breadth: float
    commit_consistency: float
    readme_quality: float
    community_engagement: float
    originality: float


class RepoSummary(BaseModel):
    name: str
    stars: int
    language: str | None
    description: str | None


class StatsResponse(BaseModel):
    public_repos: int
    followers: int
    account_age_days: int
    total_stars: int


class AnalysisResponse(BaseModel):
    id: UUID
    github_username: str
    avatar_url: str | None
    bio: str | None
    scores: ScoresResponse
    llm_feedback: str | None
    suggestions: list[str] | None
    top_languages: list[str] | None
    top_repos: list[RepoSummary] | None
    stats: StatsResponse
    credits_remaining: int
    created_at: datetime


class NoCreditsResponse(BaseModel):
    error: str = "no_credits"
    message: str = "You've used all 2 free analyses."
    upgrade_url: str = "/pricing"
