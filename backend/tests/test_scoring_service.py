from datetime import datetime, timedelta, timezone

import pytest

from app.services.scoring_service import ScoringService


class TestProjectDiversity:
    def test_high_diversity(self):
        repos = [
            {"language": lang, "fork": False, "description": f"A {lang} project", "topics": [f"topic-{i}"]}
            for i, lang in enumerate(["Python", "JavaScript", "Go", "Rust", "Java", "C++", "Ruby", "TypeScript"])
        ]
        score = ScoringService.score_project_diversity(repos)
        assert score >= 85.0

    def test_low_diversity(self):
        repos = [
            {"language": "JavaScript", "fork": False, "description": "JS app", "topics": []}
            for _ in range(3)
        ]
        score = ScoringService.score_project_diversity(repos)
        assert score <= 50.0

    def test_empty_repos(self):
        assert ScoringService.score_project_diversity([]) == 0.0

    def test_all_forks(self):
        repos = [{"language": "Python", "fork": True} for _ in range(5)]
        assert ScoringService.score_project_diversity(repos) == 0.0


class TestLanguageBreadth:
    def test_single_language(self):
        repos = [{"language": "Python", "fork": False} for _ in range(5)]
        score = ScoringService.score_language_breadth(repos)
        assert score == 30.0

    def test_polyglot(self):
        repos = [{"language": lang, "fork": False} for lang in ["Python", "JS", "Go", "Rust", "Java"]]
        score = ScoringService.score_language_breadth(repos)
        assert score == 85.0

    def test_six_plus_languages(self):
        repos = [{"language": lang, "fork": False} for lang in ["Python", "JS", "Go", "Rust", "Java", "C++"]]
        assert ScoringService.score_language_breadth(repos) == 100.0

    def test_no_repos(self):
        assert ScoringService.score_language_breadth([]) == 0.0


class TestCommitConsistency:
    def test_daily_commits(self):
        now = datetime.now(timezone.utc)
        events = [
            {"type": "PushEvent", "created_at": (now - timedelta(weeks=w)).isoformat()}
            for w in range(13)
        ]
        score = ScoringService.score_commit_consistency(events)
        assert score == 100.0

    def test_sparse_commits(self):
        now = datetime.now(timezone.utc)
        events = [
            {"type": "PushEvent", "created_at": (now - timedelta(weeks=w)).isoformat()}
            for w in [0, 5, 10]
        ]
        score = ScoringService.score_commit_consistency(events)
        assert 20.0 <= score <= 30.0

    def test_no_events(self):
        assert ScoringService.score_commit_consistency([]) == 0.0

    def test_non_push_events(self):
        events = [{"type": "IssueCommentEvent", "created_at": datetime.now(timezone.utc).isoformat()}]
        assert ScoringService.score_commit_consistency(events) == 0.0


class TestReadmeQuality:
    def test_excellent_readme(self):
        readme = """# My Project

## Installation

```bash
pip install myproject
```

## Usage

![Screenshot](screenshot.png)

[![Build Status](https://ci.example.com/badge.svg)](https://ci.example.com)

This is a comprehensive project with many features and detailed documentation.
"""
        score = ScoringService.score_readme_quality({"repo1": readme})
        assert score >= 80.0

    def test_missing_readmes(self):
        assert ScoringService.score_readme_quality({}) == 0.0

    def test_minimal_readme(self):
        score = ScoringService.score_readme_quality({"repo": "Hello"})
        assert score == 0.0


class TestCommunityEngagement:
    def test_high_engagement(self):
        profile = {"followers": 1000, "created_at": "2020-01-01T00:00:00Z"}
        repos = [{"stargazers_count": 5000, "fork": False}]
        score = ScoringService.score_community_engagement(profile, repos)
        assert score >= 90.0

    def test_zero_engagement(self):
        profile = {"followers": 0, "created_at": "2020-01-01T00:00:00Z"}
        repos = [{"stargazers_count": 0, "fork": False}]
        score = ScoringService.score_community_engagement(profile, repos)
        assert score == 20.0


class TestOriginality:
    def test_all_original(self):
        repos = [{"fork": False, "size": 500} for _ in range(5)]
        score = ScoringService.score_originality(repos)
        assert score == 100.0

    def test_all_forks(self):
        repos = [{"fork": True, "size": 100} for _ in range(5)]
        score = ScoringService.score_originality(repos)
        assert score == 0.0

    def test_mixed(self):
        repos = [{"fork": False, "size": 200}] * 3 + [{"fork": True, "size": 100}] * 2
        score = ScoringService.score_originality(repos)
        assert 60.0 <= score <= 80.0


class TestOverallScore:
    def test_weighted_sum(self):
        from app.services.github_service import GitHubData

        now = datetime.now(timezone.utc)
        data = GitHubData(
            profile={"followers": 10, "created_at": "2022-01-01T00:00:00Z"},
            repos=[
                {"language": lang, "fork": False, "stargazers_count": 5, "description": f"A {lang} project", "topics": [], "size": 200}
                for lang in ["Python", "JavaScript", "Go"]
            ],
            events=[
                {"type": "PushEvent", "created_at": (now - timedelta(weeks=w)).isoformat()}
                for w in range(8)
            ],
            readmes={"repo": "# Title\n\nSome content here with enough length to score."},
        )
        scores = ScoringService.calculate_scores(data)
        assert "overall" in scores
        assert 0 <= scores["overall"] <= 100


class TestExtractTopLanguages:
    def test_extract(self):
        repos = [
            {"language": "Python", "fork": False},
            {"language": "Python", "fork": False},
            {"language": "JavaScript", "fork": False},
            {"language": "Go", "fork": False},
            {"language": None, "fork": False},
        ]
        langs = ScoringService.extract_top_languages(repos)
        assert langs[0] == "Python"
        assert len(langs) == 3


class TestExtractTopRepos:
    def test_extract(self):
        repos = [
            {"name": f"repo-{i}", "stargazers_count": i * 10, "language": "Python", "description": f"Repo {i}", "fork": False}
            for i in range(10)
        ]
        top = ScoringService.extract_top_repos(repos, n=3)
        assert len(top) == 3
        assert top[0]["name"] == "repo-9"
        assert top[0]["stars"] == 90
