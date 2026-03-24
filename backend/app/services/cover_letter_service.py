import logging

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.cover_letter import CoverLetterResponse
from app.services.github_service import GitHubService
from app.services.groq_service import GroqService
from app.services.scoring_service import ScoringService

logger = logging.getLogger(__name__)


class CoverLetterService:
    @staticmethod
    async def generate(
        db: AsyncSession,
        user: User,
        job_description: str,
        resume_text: str | None = None,
        github_username: str | None = None,
    ) -> CoverLetterResponse:
        # Optionally fetch GitHub data
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
                    f"Top Projects: {repos_summary}\n"
                    f"Public repos: {github_data.profile.get('public_repos', 0)}\n"
                    f"Bio: {github_data.profile.get('bio', '')}"
                )
            except Exception:
                logger.warning("Failed to fetch GitHub data for cover letter")

        result = await GroqService.generate_cover_letter(
            job_description=job_description,
            resume_text=resume_text,
            github_context=github_context,
        )

        if not result:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate cover letter. Please try again.",
            )

        # Deduct credit
        if not user.is_premium and user.credits_remaining > 0:
            user.credits_remaining -= 1
        await db.commit()

        return CoverLetterResponse(
            cover_letter=result,
            credits_remaining=user.credits_remaining,
        )
