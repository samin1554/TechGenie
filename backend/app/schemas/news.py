from pydantic import BaseModel


class Editorial(BaseModel):
    date: str  # e.g. "Mar 23"
    title: str
    byline: str
    url: str | None = None


class EditorialsResponse(BaseModel):
    editorials: list[Editorial]
    ticker: list[str]
