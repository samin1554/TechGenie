from pydantic import BaseModel, Field


class LinkedInOptimizeRequest(BaseModel):
    headline: str = Field(..., min_length=5, max_length=300)
    about: str = Field(..., min_length=20, max_length=50000)
    target_role: str | None = Field(default=None, max_length=100)
    github_username: str | None = Field(default=None, max_length=39)


class LinkedInOptimizeResponse(BaseModel):
    optimized_headline: str
    optimized_about: str
    keywords: list[str]
    strength_score: int
    suggestions: list[str]
    credits_remaining: int
