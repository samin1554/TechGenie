import math
import re
from collections import Counter
from datetime import datetime, timezone

from app.services.github_service import GitHubData

WEIGHTS = {
    "project_diversity": 0.20,
    "language_breadth": 0.15,
    "commit_consistency": 0.20,
    "readme_quality": 0.15,
    "community_engagement": 0.15,
    "originality": 0.15,
}


class ScoringService:
    @staticmethod
    def calculate_scores(data: GitHubData) -> dict:
        scores = {
            "project_diversity": ScoringService.score_project_diversity(data.repos),
            "language_breadth": ScoringService.score_language_breadth(data.repos),
            "commit_consistency": ScoringService.score_commit_consistency(data.events),
            "readme_quality": ScoringService.score_readme_quality(data.readmes),
            "community_engagement": ScoringService.score_community_engagement(
                data.profile, data.repos
            ),
            "originality": ScoringService.score_originality(data.repos),
        }
        overall = sum(scores[k] * WEIGHTS[k] for k in WEIGHTS)
        scores["overall"] = round(overall, 1)
        return scores

    @staticmethod
    def score_project_diversity(repos: list[dict]) -> float:
        if not repos:
            return 0.0
        non_forks = [r for r in repos if not r.get("fork")]
        if not non_forks:
            return 0.0

        languages = set()
        topics = set()
        for repo in non_forks:
            lang = repo.get("language")
            if lang:
                languages.add(lang)
            desc = (repo.get("description") or "").lower()
            for topic in repo.get("topics", []):
                topics.add(topic.lower())
            if desc:
                topics.add(desc[:50])

        distinct_signals = len(languages) + len(topics)
        if distinct_signals >= 15:
            return 100.0
        if distinct_signals >= 10:
            return 85.0
        if distinct_signals >= 7:
            return 70.0
        if distinct_signals >= 5:
            return 60.0
        if distinct_signals >= 3:
            return 45.0
        return max(20.0, distinct_signals * 10)

    @staticmethod
    def score_language_breadth(repos: list[dict]) -> float:
        languages = set()
        for repo in repos:
            lang = repo.get("language")
            if lang and not repo.get("fork"):
                languages.add(lang)

        count = len(languages)
        scale = {0: 0, 1: 30, 2: 50, 3: 65, 4: 75, 5: 85}
        if count >= 6:
            return 100.0
        return float(scale.get(count, 0))

    @staticmethod
    def score_commit_consistency(events: list[dict]) -> float:
        push_events = [e for e in events if e.get("type") == "PushEvent"]
        if not push_events:
            return 0.0

        now = datetime.now(timezone.utc)
        weeks_with_commits: set[int] = set()

        for event in push_events:
            created_at = event.get("created_at", "")
            try:
                event_date = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                days_ago = (now - event_date).days
                if days_ago <= 90:
                    week_num = days_ago // 7
                    weeks_with_commits.add(week_num)
            except (ValueError, TypeError):
                continue

        total_weeks = 13
        active_weeks = len(weeks_with_commits)
        base_score = (active_weeks / total_weeks) * 100

        consecutive = 0
        max_streak = 0
        for week in range(total_weeks):
            if week in weeks_with_commits:
                consecutive += 1
                max_streak = max(max_streak, consecutive)
            else:
                consecutive = 0

        streak_bonus = min(10, max_streak * 2) if max_streak >= 4 else 0
        return min(100.0, round(base_score + streak_bonus, 1))

    @staticmethod
    def score_readme_quality(readmes: dict[str, str]) -> float:
        if not readmes:
            return 0.0

        scores = []
        for content in readmes.values():
            score = ScoringService._score_single_readme(content)
            scores.append(score)

        return round(sum(scores) / len(scores), 1)

    @staticmethod
    def _score_single_readme(content: str) -> float:
        if not content or len(content.strip()) < 10:
            return 0.0

        score = 0.0
        if len(content) > 200:
            score += 25
        elif len(content) > 50:
            score += 15

        if re.search(r"^#{1,3}\s", content, re.MULTILINE):
            score += 20
        if re.search(r"```", content):
            score += 20
        if re.search(r"\!\[.*\]\(.*\)", content) or re.search(r"<img", content):
            score += 15
        if re.search(r"\[!\[.*\]\(.*\)\]\(.*\)", content):
            score += 10
        if re.search(r"##\s*(install|setup|usage|getting.started)", content, re.IGNORECASE):
            score += 10

        return min(100.0, score)

    @staticmethod
    def score_community_engagement(profile: dict, repos: list[dict]) -> float:
        total_stars = sum(r.get("stargazers_count", 0) for r in repos if not r.get("fork"))
        followers = profile.get("followers", 0)

        engagement = total_stars + (followers * 2)
        if engagement == 0:
            return 20.0

        log_score = math.log10(engagement + 1) * 25
        account_created = profile.get("created_at", "")
        try:
            created_date = datetime.fromisoformat(account_created.replace("Z", "+00:00"))
            age_days = (datetime.now(timezone.utc) - created_date).days
            if age_days < 365:
                log_score *= 1.2
        except (ValueError, TypeError):
            pass

        return min(100.0, round(max(20.0, log_score), 1))

    @staticmethod
    def score_originality(repos: list[dict]) -> float:
        if not repos:
            return 0.0

        total = len(repos)
        forks = sum(1 for r in repos if r.get("fork"))
        non_forks = total - forks

        if total == 0:
            return 0.0

        base_score = (non_forks / total) * 100
        meaningful = sum(
            1 for r in repos if not r.get("fork") and r.get("size", 0) > 100
        )
        bonus = min(10, meaningful * 2)

        return min(100.0, round(base_score + bonus, 1))

    @staticmethod
    def extract_top_languages(repos: list[dict], n: int = 5) -> list[str]:
        lang_counter: Counter[str] = Counter()
        for repo in repos:
            lang = repo.get("language")
            if lang and not repo.get("fork"):
                lang_counter[lang] += 1
        return [lang for lang, _ in lang_counter.most_common(n)]

    @staticmethod
    def extract_top_repos(repos: list[dict], n: int = 5) -> list[dict]:
        non_forks = [r for r in repos if not r.get("fork")]
        sorted_repos = sorted(
            non_forks, key=lambda r: r.get("stargazers_count", 0), reverse=True
        )
        return [
            {
                "name": r["name"],
                "stars": r.get("stargazers_count", 0),
                "language": r.get("language"),
                "description": r.get("description"),
            }
            for r in sorted_repos[:n]
        ]
