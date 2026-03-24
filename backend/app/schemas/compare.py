from pydantic import BaseModel, Field

from app.schemas.analysis import RepoSummary, ScoresResponse, StatsResponse


class CompareRequest(BaseModel):
    username_a: str = Field(..., min_length=1, max_length=39)
    username_b: str = Field(..., min_length=1, max_length=39)


class ProfileSummary(BaseModel):
    username: str
    avatar_url: str | None
    bio: str | None
    scores: ScoresResponse
    top_languages: list[str]
    top_repos: list[RepoSummary]
    stats: StatsResponse


class CompareResponse(BaseModel):
    user_a: ProfileSummary
    user_b: ProfileSummary
    winners: dict[str, str]  # dimension name -> winning username or "tie"
