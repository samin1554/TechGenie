from pydantic import BaseModel, Field


class SkillGapRequest(BaseModel):
    job_description: str = Field(..., min_length=20, max_length=50000, description="Job description to analyze against")
    github_username: str | None = Field(default=None, max_length=39, description="GitHub username to pull skills from")
    resume_text: str | None = Field(default=None, max_length=10000, description="Resume text to pull skills from")


class SkillMatch(BaseModel):
    skill: str
    status: str  # "match", "partial", "missing"
    source: str | None  # "github", "resume", "both", or null for missing


class SkillGapResponse(BaseModel):
    matching: list[SkillMatch]
    partial: list[SkillMatch]
    missing: list[SkillMatch]
    recommendations: list[str]
    match_percentage: float
    credits_remaining: int
