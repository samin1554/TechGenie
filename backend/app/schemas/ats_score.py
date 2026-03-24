from pydantic import BaseModel, Field


class ATSScoreRequest(BaseModel):
    resume_text: str = Field(..., min_length=10, description="Extracted text from uploaded resume")
    role: str | None = Field(default=None, description="Optional target role for scoring context")


class ATSScoreCategory(BaseModel):
    name: str
    score: int
    max_score: int
    feedback: str


class ATSScoreResponse(BaseModel):
    overall: int = Field(..., ge=0, le=100)
    categories: list[ATSScoreCategory]
    summary: str
    recommendations: list[str]
