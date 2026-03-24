import asyncio
from datetime import datetime, timezone

from app.schemas.analysis import RepoSummary, ScoresResponse, StatsResponse
from app.schemas.compare import CompareResponse, ProfileSummary
from app.services.github_service import GitHubData, GitHubService
from app.services.scoring_service import ScoringService

DIMENSIONS = [
    "project_diversity",
    "language_breadth",
    "commit_consistency",
    "readme_quality",
    "community_engagement",
    "originality",
    "overall",
]


class CompareService:
    @staticmethod
    async def compare(username_a: str, username_b: str) -> CompareResponse:
        # Fetch both profiles in parallel
        data_a, data_b = await asyncio.gather(
            GitHubService.fetch_user_data(username_a.strip().lower()),
            GitHubService.fetch_user_data(username_b.strip().lower()),
        )

        summary_a = CompareService._build_summary(data_a)
        summary_b = CompareService._build_summary(data_b)

        # Determine winners per dimension
        winners: dict[str, str] = {}
        for dim in DIMENSIONS:
            score_a = getattr(summary_a.scores, dim)
            score_b = getattr(summary_b.scores, dim)
            if score_a > score_b:
                winners[dim] = summary_a.username
            elif score_b > score_a:
                winners[dim] = summary_b.username
            else:
                winners[dim] = "tie"

        return CompareResponse(user_a=summary_a, user_b=summary_b, winners=winners)

    @staticmethod
    def _build_summary(data: GitHubData) -> ProfileSummary:
        scores = ScoringService.calculate_scores(data)
        top_languages = ScoringService.extract_top_languages(data.repos)
        top_repos_raw = ScoringService.extract_top_repos(data.repos)

        profile = data.profile
        account_created = profile.get("created_at", "")
        try:
            created_date = datetime.fromisoformat(account_created.replace("Z", "+00:00"))
            account_age_days = (datetime.now(timezone.utc) - created_date).days
        except (ValueError, TypeError):
            account_age_days = 0

        total_stars = sum(r.get("stars", 0) for r in top_repos_raw)

        return ProfileSummary(
            username=profile.get("login", ""),
            avatar_url=profile.get("avatar_url"),
            bio=profile.get("bio"),
            scores=ScoresResponse(
                overall=scores["overall"],
                project_diversity=scores["project_diversity"],
                language_breadth=scores["language_breadth"],
                commit_consistency=scores["commit_consistency"],
                readme_quality=scores["readme_quality"],
                community_engagement=scores["community_engagement"],
                originality=scores["originality"],
            ),
            top_languages=top_languages,
            top_repos=[RepoSummary(**r) for r in top_repos_raw],
            stats=StatsResponse(
                public_repos=profile.get("public_repos", 0),
                followers=profile.get("followers", 0),
                account_age_days=account_age_days,
                total_stars=total_stars,
            ),
        )
