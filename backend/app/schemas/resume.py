from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


# --- Request schemas ---

ROLE_CHOICES = [
    "software_engineer",
    "frontend_engineer",
    "backend_engineer",
    "fullstack_engineer",
    "ai_ml_engineer",
    "data_engineer",
    "devops_sre",
    "mobile_engineer",
    "cybersecurity_engineer",
    "other",
]

TONE_CHOICES = ["conservative", "balanced", "creative"]
TEMPLATE_CHOICES = ["jake", "swe_default"]


class GenerateResumeRequest(BaseModel):
    resume_text: str = Field(..., min_length=10, description="Extracted text from uploaded resume")
    template: str = Field(default="jake", description="Resume template")
    role: str = Field(default="software_engineer", description="Target role")
    job_description: str | None = Field(default=None, description="Optional job description to optimize for")
    tone: str = Field(default="balanced", description="conservative, balanced, or creative")
    github_username: str | None = Field(default=None, description="Optional GitHub username to enhance resume")


class ParseResumeResponse(BaseModel):
    text: str


# --- Resume section schemas ---

class ResumeHeader(BaseModel):
    name: str
    email: str | None = None
    phone: str | None = None
    github_url: str | None = None
    location: str | None = None
    linkedin: str | None = None
    website: str | None = None


class ResumeSkills(BaseModel):
    languages: list[str] = []
    frameworks: list[str] = []
    tools: list[str] = []
    other: list[str] = []


class ResumeProject(BaseModel):
    name: str
    tech_stack: str
    url: str | None = None
    bullets: list[str]


class ResumeExperience(BaseModel):
    title: str
    org: str
    date_range: str | None = None
    bullets: list[str]


class ResumeEducation(BaseModel):
    school: str
    degree: str
    date_range: str | None = None
    details: str | None = None


# --- Response schemas ---

class ResumeResponse(BaseModel):
    id: UUID
    github_username: str | None
    header: ResumeHeader
    summary: str
    skills: ResumeSkills
    projects: list[ResumeProject]
    experience: list[ResumeExperience]
    education: list[ResumeEducation]
    template: str
    is_edited: bool
    credits_remaining: int
    created_at: datetime
    updated_at: datetime


class ResumeUpdateRequest(BaseModel):
    header: ResumeHeader | None = None
    summary: str | None = None
    skills: ResumeSkills | None = None
    projects: list[ResumeProject] | None = None
    experience: list[ResumeExperience] | None = None
    education: list[ResumeEducation] | None = None


class ResumeListItem(BaseModel):
    id: UUID
    github_username: str | None
    header_name: str
    template: str
    is_edited: bool
    created_at: datetime
    updated_at: datetime
