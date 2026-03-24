from pydantic import BaseModel


class Job(BaseModel):
    title: str
    company: str
    location: str
    date_posted: str
    employment_type: str | None = None
    is_remote: bool = False
    description_snippet: str
    apply_url: str
    company_logo: str | None = None


class JobsResponse(BaseModel):
    jobs: list[Job]
    total: int
    page: int
    has_more: bool
