import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Resume(Base):
    __tablename__ = "resumes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    github_username: Mapped[str | None] = mapped_column(String(39), nullable=True, index=True)

    # Structured resume content
    header: Mapped[dict] = mapped_column(JSONB, nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    skills: Mapped[dict] = mapped_column(JSONB, nullable=False)
    projects: Mapped[dict] = mapped_column(JSONB, nullable=False)  # list stored as JSONB
    experience: Mapped[dict] = mapped_column(JSONB, nullable=False)  # list stored as JSONB
    education: Mapped[dict] = mapped_column(JSONB, nullable=False)  # list stored as JSONB

    # Metadata
    template: Mapped[str] = mapped_column(String(50), default="jake")
    is_edited: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
