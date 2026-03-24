from pydantic import BaseModel, Field


class CoverLetterRequest(BaseModel):
    job_description: str = Field(..., min_length=20, max_length=50000, description="Job description to tailor the cover letter to")
    resume_text: str | None = Field(default=None, max_length=10000, description="Optional resume text to reference")
    github_username: str | None = Field(default=None, max_length=39, description="Optional GitHub username to reference projects")


class CoverLetterResponse(BaseModel):
    cover_letter: str
    credits_remaining: int
