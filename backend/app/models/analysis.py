import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, Index, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class GitHubAnalysis(Base):
    __tablename__ = "github_analyses"
    __table_args__ = (
        Index("ix_analyses_username", "github_username"),
        Index("ix_analyses_expires_at", "expires_at"),
        Index("ix_analyses_created_at", "created_at"),
        UniqueConstraint(
            "github_username",
            "analysis_date",
            name="uq_username_day",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    github_username: Mapped[str] = mapped_column(String(39), nullable=False)
    analysis_date: Mapped[str] = mapped_column(String(10), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    bio: Mapped[str | None] = mapped_column(Text)
    public_repos: Mapped[int | None] = mapped_column(Integer)
    followers: Mapped[int | None] = mapped_column(Integer)
    following: Mapped[int | None] = mapped_column(Integer)
    account_age_days: Mapped[int | None] = mapped_column(Integer)

    score_overall: Mapped[float] = mapped_column(Float, nullable=False)
    score_project_diversity: Mapped[float] = mapped_column(Float, nullable=False)
    score_language_breadth: Mapped[float] = mapped_column(Float, nullable=False)
    score_commit_consistency: Mapped[float] = mapped_column(Float, nullable=False)
    score_readme_quality: Mapped[float] = mapped_column(Float, nullable=False)
    score_community_engagement: Mapped[float] = mapped_column(Float, nullable=False)
    score_originality: Mapped[float] = mapped_column(Float, nullable=False)

    top_languages: Mapped[dict | None] = mapped_column(JSONB)
    top_repos: Mapped[dict | None] = mapped_column(JSONB)
    raw_data: Mapped[dict] = mapped_column(JSONB, nullable=False)
    llm_feedback: Mapped[str | None] = mapped_column(Text)
    llm_suggestions: Mapped[dict | None] = mapped_column(JSONB)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
