from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.analysis import GitHubAnalysis
from app.models.user_analysis import UserAnalysis
from app.schemas.analysis import ScoresResponse
from app.schemas.history import HistoryItem


class HistoryService:
    @staticmethod
    async def get_user_history(db: AsyncSession, user_id: UUID) -> list[HistoryItem]:
        result = await db.execute(
            select(GitHubAnalysis)
            .join(UserAnalysis, UserAnalysis.analysis_id == GitHubAnalysis.id)
            .where(UserAnalysis.user_id == user_id)
            .order_by(GitHubAnalysis.created_at.desc())
        )
        analyses = result.scalars().all()

        return [
            HistoryItem(
                id=a.id,
                github_username=a.github_username,
                avatar_url=a.avatar_url,
                score_overall=a.score_overall,
                scores=ScoresResponse(
                    overall=a.score_overall,
                    project_diversity=a.score_project_diversity,
                    language_breadth=a.score_language_breadth,
                    commit_consistency=a.score_commit_consistency,
                    readme_quality=a.score_readme_quality,
                    community_engagement=a.score_community_engagement,
                    originality=a.score_originality,
                ),
                created_at=a.created_at,
            )
            for a in analyses
        ]

    @staticmethod
    async def delete_user_analysis(db: AsyncSession, user_id: UUID, analysis_id: UUID) -> bool:
        result = await db.execute(
            delete(UserAnalysis).where(
                UserAnalysis.user_id == user_id,
                UserAnalysis.analysis_id == analysis_id,
            )
        )
        await db.commit()
        return result.rowcount > 0
