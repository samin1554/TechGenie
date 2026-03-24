from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.analysis import GitHubAnalysis
from app.models.user import User
from app.models.user_analysis import UserAnalysis
from app.schemas.analysis import (
    AnalysisResponse,
    RepoSummary,
    ScoresResponse,
    StatsResponse,
)
from app.services.github_service import (
    GitHubRateLimitError,
    GitHubService,
    GitHubUserNotFoundError,
)
from app.services.groq_service import GroqService
from app.services.scoring_service import ScoringService


class AnalysisService:
    @staticmethod
    async def analyze(
        db: AsyncSession, user: User, github_username: str
    ) -> AnalysisResponse:
        username = github_username.strip().lower()
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        cached = await AnalysisService._get_cached(db, username, today)
        if cached:
            await AnalysisService._link_and_deduct(db, user, cached)
            return AnalysisService._to_response(cached, user.credits_remaining)

        try:
            github_data = await GitHubService.fetch_user_data(username)
        except GitHubUserNotFoundError:
            raise HTTPException(status_code=404, detail="GitHub user not found")
        except GitHubRateLimitError:
            raise HTTPException(status_code=429, detail="GitHub API rate limit exceeded")

        scores = ScoringService.calculate_scores(github_data)
        top_languages = ScoringService.extract_top_languages(github_data.repos)
        top_repos = ScoringService.extract_top_repos(github_data.repos)

        profile = github_data.profile
        account_created = profile.get("created_at", "")
        try:
            created_date = datetime.fromisoformat(account_created.replace("Z", "+00:00"))
            account_age_days = (datetime.now(timezone.utc) - created_date).days
        except (ValueError, TypeError):
            account_age_days = 0

        llm_result = await GroqService.generate_feedback(
            username=username,
            scores=scores,
            top_repos=top_repos,
            top_languages=top_languages,
            account_age_days=account_age_days,
        )

        analysis = GitHubAnalysis(
            github_username=username,
            analysis_date=today,
            avatar_url=profile.get("avatar_url"),
            bio=profile.get("bio"),
            public_repos=profile.get("public_repos", 0),
            followers=profile.get("followers", 0),
            following=profile.get("following", 0),
            account_age_days=account_age_days,
            score_overall=scores["overall"],
            score_project_diversity=scores["project_diversity"],
            score_language_breadth=scores["language_breadth"],
            score_commit_consistency=scores["commit_consistency"],
            score_readme_quality=scores["readme_quality"],
            score_community_engagement=scores["community_engagement"],
            score_originality=scores["originality"],
            top_languages=top_languages,
            top_repos=top_repos,
            raw_data={
                "profile": profile,
                "repos_count": len(github_data.repos),
                "events_count": len(github_data.events),
            },
            llm_feedback=llm_result.get("feedback") if llm_result else None,
            llm_suggestions=llm_result.get("suggestions") if llm_result else None,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
        )

        db.add(analysis)
        await db.flush()

        await AnalysisService._link_and_deduct(db, user, analysis)
        await db.commit()
        await db.refresh(analysis)

        return AnalysisService._to_response(analysis, user.credits_remaining)

    @staticmethod
    async def get_by_id(
        db: AsyncSession, user: User, analysis_id: UUID
    ) -> AnalysisResponse | None:
        result = await db.execute(
            select(GitHubAnalysis)
            .join(UserAnalysis, UserAnalysis.analysis_id == GitHubAnalysis.id)
            .where(
                GitHubAnalysis.id == analysis_id,
                UserAnalysis.user_id == user.id,
            )
        )
        analysis = result.scalar_one_or_none()
        if not analysis:
            return None
        return AnalysisService._to_response(analysis, user.credits_remaining)

    @staticmethod
    async def _get_cached(
        db: AsyncSession, username: str, today: str
    ) -> GitHubAnalysis | None:
        result = await db.execute(
            select(GitHubAnalysis).where(
                GitHubAnalysis.github_username == username,
                GitHubAnalysis.analysis_date == today,
                GitHubAnalysis.expires_at > datetime.now(timezone.utc),
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def _link_and_deduct(
        db: AsyncSession, user: User, analysis: GitHubAnalysis
    ) -> None:
        existing = await db.execute(
            select(UserAnalysis).where(
                UserAnalysis.user_id == user.id,
                UserAnalysis.analysis_id == analysis.id,
            )
        )
        if not existing.scalar_one_or_none():
            db.add(UserAnalysis(user_id=user.id, analysis_id=analysis.id))
            if not user.is_premium and user.credits_remaining > 0:
                user.credits_remaining -= 1

    @staticmethod
    def _to_response(analysis: GitHubAnalysis, credits_remaining: int) -> AnalysisResponse:
        total_stars = 0
        if analysis.top_repos:
            total_stars = sum(r.get("stars", 0) for r in analysis.top_repos)

        return AnalysisResponse(
            id=analysis.id,
            github_username=analysis.github_username,
            avatar_url=analysis.avatar_url,
            bio=analysis.bio,
            scores=ScoresResponse(
                overall=analysis.score_overall,
                project_diversity=analysis.score_project_diversity,
                language_breadth=analysis.score_language_breadth,
                commit_consistency=analysis.score_commit_consistency,
                readme_quality=analysis.score_readme_quality,
                community_engagement=analysis.score_community_engagement,
                originality=analysis.score_originality,
            ),
            llm_feedback=analysis.llm_feedback,
            suggestions=analysis.llm_suggestions,
            top_languages=analysis.top_languages,
            top_repos=[RepoSummary(**r) for r in analysis.top_repos] if analysis.top_repos else None,
            stats=StatsResponse(
                public_repos=analysis.public_repos or 0,
                followers=analysis.followers or 0,
                account_age_days=analysis.account_age_days or 0,
                total_stars=total_stars,
            ),
            credits_remaining=credits_remaining,
            created_at=analysis.created_at,
        )
