import logging
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.resume import Resume
from app.models.user import User
from app.schemas.resume import (
    ResumeEducation,
    ResumeExperience,
    ResumeHeader,
    ResumeListItem,
    ResumeProject,
    ResumeResponse,
    ResumeSkills,
    ResumeUpdateRequest,
)
from app.services.github_service import GitHubService
from app.services.groq_service import GroqService
from app.services.scoring_service import ScoringService

logger = logging.getLogger(__name__)


class ResumeService:
    @staticmethod
    async def generate(
        db: AsyncSession,
        user: User,
        resume_text: str,
        template: str = "jake",
        role: str = "software_engineer",
        job_description: str | None = None,
        tone: str = "balanced",
        github_username: str | None = None,
    ) -> ResumeResponse:
        # Optionally fetch GitHub data to enhance resume
        github_context = None
        if github_username:
            try:
                github_data = await GitHubService.fetch_user_data(github_username.strip().lower())
                top_languages = ScoringService.extract_top_languages(github_data.repos)
                top_repos = ScoringService.extract_top_repos(github_data.repos)

                repos_summary = ", ".join(
                    f"{r['name']} ({r.get('language', 'N/A')}, {r.get('stars', 0)} stars)"
                    for r in top_repos[:5]
                )
                github_context = (
                    f"Languages: {', '.join(top_languages)}\n"
                    f"Top Repos: {repos_summary}\n"
                    f"Public repos: {github_data.profile.get('public_repos', 0)}\n"
                    f"Bio: {github_data.profile.get('bio', '')}"
                )
            except Exception:
                logger.warning("Failed to fetch GitHub data for resume enhancement")

        # Call Groq to optimize the resume
        llm_result = await GroqService.optimize_resume(
            resume_text=resume_text,
            role=role,
            tone=tone,
            job_description=job_description,
            github_context=github_context,
        )

        if not llm_result:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate resume. Please try again.",
            )

        resume = Resume(
            user_id=user.id,
            github_username=github_username.strip().lower() if github_username else None,
            header=llm_result.get("header", {}),
            summary=llm_result.get("summary", ""),
            skills=llm_result.get("skills", {}),
            projects=llm_result.get("projects", []),
            experience=llm_result.get("experience", []),
            education=llm_result.get("education", []),
            template=template,
        )

        db.add(resume)

        # Deduct credit
        if not user.is_premium and user.credits_remaining > 0:
            user.credits_remaining -= 1

        await db.commit()
        await db.refresh(resume)

        return ResumeService._to_response(resume, user.credits_remaining)

    @staticmethod
    async def get_by_id(
        db: AsyncSession, user: User, resume_id: UUID
    ) -> ResumeResponse | None:
        result = await db.execute(
            select(Resume).where(Resume.id == resume_id, Resume.user_id == user.id)
        )
        resume = result.scalar_one_or_none()
        if not resume:
            return None
        return ResumeService._to_response(resume, user.credits_remaining)

    @staticmethod
    async def update(
        db: AsyncSession, user: User, resume_id: UUID, update_data: ResumeUpdateRequest
    ) -> ResumeResponse | None:
        result = await db.execute(
            select(Resume).where(Resume.id == resume_id, Resume.user_id == user.id)
        )
        resume = result.scalar_one_or_none()
        if not resume:
            return None

        update_dict = update_data.model_dump(exclude_none=True)
        for field, value in update_dict.items():
            if isinstance(value, list):
                setattr(resume, field, [
                    v.model_dump() if hasattr(v, "model_dump") else v for v in value
                ])
            elif hasattr(value, "model_dump"):
                setattr(resume, field, value.model_dump())
            else:
                setattr(resume, field, value)

        resume.is_edited = True
        await db.commit()
        await db.refresh(resume)

        return ResumeService._to_response(resume, user.credits_remaining)

    @staticmethod
    async def delete(db: AsyncSession, user: User, resume_id: UUID) -> bool:
        result = await db.execute(
            select(Resume).where(Resume.id == resume_id, Resume.user_id == user.id)
        )
        resume = result.scalar_one_or_none()
        if not resume:
            return False
        await db.delete(resume)
        await db.commit()
        return True

    @staticmethod
    async def list_user_resumes(db: AsyncSession, user_id: UUID) -> list[ResumeListItem]:
        result = await db.execute(
            select(Resume)
            .where(Resume.user_id == user_id)
            .order_by(Resume.created_at.desc())
        )
        resumes = result.scalars().all()

        return [
            ResumeListItem(
                id=r.id,
                github_username=r.github_username,
                header_name=(
                    r.header.get("name", r.github_username or "Untitled")
                    if isinstance(r.header, dict)
                    else r.github_username or "Untitled"
                ),
                template=r.template,
                is_edited=r.is_edited,
                created_at=r.created_at,
                updated_at=r.updated_at,
            )
            for r in resumes
        ]

    @staticmethod
    def _to_response(resume: Resume, credits_remaining: int) -> ResumeResponse:
        return ResumeResponse(
            id=resume.id,
            github_username=resume.github_username,
            header=ResumeHeader(**(resume.header if isinstance(resume.header, dict) else {})),
            summary=resume.summary,
            skills=ResumeSkills(**(resume.skills if isinstance(resume.skills, dict) else {})),
            projects=[
                ResumeProject(**p)
                for p in (resume.projects if isinstance(resume.projects, list) else [])
            ],
            experience=[
                ResumeExperience(**e)
                for e in (resume.experience if isinstance(resume.experience, list) else [])
            ],
            education=[
                ResumeEducation(**e)
                for e in (resume.education if isinstance(resume.education, list) else [])
            ],
            template=resume.template,
            is_edited=resume.is_edited,
            credits_remaining=credits_remaining,
            created_at=resume.created_at,
            updated_at=resume.updated_at,
        )
