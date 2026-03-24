import logging

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.skill_gap import SkillGapResponse, SkillMatch
from app.services.github_service import GitHubService
from app.services.groq_service import GroqService
from app.services.scoring_service import ScoringService

logger = logging.getLogger(__name__)


class SkillGapService:
    @staticmethod
    async def analyze(
        db: AsyncSession,
        user: User,
        job_description: str,
        github_username: str | None = None,
        resume_text: str | None = None,
    ) -> SkillGapResponse:
        if not github_username and not resume_text:
            raise HTTPException(
                status_code=400,
                detail="Provide at least a GitHub username or resume text",
            )

        # Build user skills context
        skills_parts: list[str] = []

        if github_username:
            try:
                github_data = await GitHubService.fetch_user_data(github_username.strip().lower())
                top_languages = ScoringService.extract_top_languages(github_data.repos)
                top_repos = ScoringService.extract_top_repos(github_data.repos)

                repos_summary = ", ".join(
                    f"{r['name']} ({r.get('language', 'N/A')}, {r.get('stars', 0)} stars)"
                    for r in top_repos[:5]
                )
                skills_parts.append(
                    f"GitHub Profile:\n"
                    f"Languages: {', '.join(top_languages)}\n"
                    f"Top Projects: {repos_summary}\n"
                    f"Public repos: {github_data.profile.get('public_repos', 0)}"
                )
            except Exception:
                logger.warning("Failed to fetch GitHub data for skill gap analysis")

        if resume_text:
            skills_parts.append(f"Resume Content:\n{resume_text[:2000]}")

        if not skills_parts:
            raise HTTPException(
                status_code=400,
                detail="Could not retrieve skills from the provided sources",
            )

        user_skills_context = "\n\n".join(skills_parts)

        result = await GroqService.analyze_skill_gap(
            job_description=job_description,
            user_skills_context=user_skills_context,
        )

        if not result:
            raise HTTPException(
                status_code=500,
                detail="Failed to analyze skill gap. Please try again.",
            )

        # Deduct credit
        if not user.is_premium and user.credits_remaining > 0:
            user.credits_remaining -= 1
        await db.commit()

        return SkillGapResponse(
            matching=[SkillMatch(**s) for s in result.get("matching", [])],
            partial=[SkillMatch(**s) for s in result.get("partial", [])],
            missing=[SkillMatch(**s) for s in result.get("missing", [])],
            recommendations=result.get("recommendations", []),
            match_percentage=result.get("match_percentage", 0.0),
            credits_remaining=user.credits_remaining,
        )
