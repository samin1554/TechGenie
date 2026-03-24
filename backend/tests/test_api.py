import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch

import pytest

from app.models.analysis import GitHubAnalysis
from app.models.user_analysis import UserAnalysis
from tests.conftest import create_test_token, create_test_user


class TestHealthEndpoint:
    @pytest.mark.asyncio
    async def test_health(self, client):
        resp = await client.get("/api/v1/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"


class TestAnalyzeEndpoint:
    @pytest.mark.asyncio
    async def test_analyze_no_auth(self, client):
        resp = await client.post("/api/v1/analyze", json={"github_username": "torvalds"})
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_analyze_no_credits(self, client, db):
        user = await create_test_user(db, credits_remaining=0, is_premium=False)
        token = create_test_token(user)
        resp = await client.post(
            "/api/v1/analyze",
            json={"github_username": "torvalds"},
            cookies={"token": token},
        )
        assert resp.status_code == 402
        data = resp.json()
        assert data["detail"]["error"] == "no_credits"

    @pytest.mark.asyncio
    async def test_analyze_invalid_input(self, client, db):
        user = await create_test_user(db)
        token = create_test_token(user)
        resp = await client.post(
            "/api/v1/analyze",
            json={"github_username": ""},
            cookies={"token": token},
        )
        assert resp.status_code == 422

    @pytest.mark.asyncio
    @patch("app.services.analysis_service.GitHubService")
    @patch("app.services.analysis_service.GroqService")
    async def test_analyze_success(self, mock_groq, mock_github, client, db):
        user = await create_test_user(db, credits_remaining=2)
        token = create_test_token(user)

        from app.services.github_service import GitHubData

        mock_github.fetch_user_data = AsyncMock(
            return_value=GitHubData(
                profile={
                    "login": "torvalds",
                    "avatar_url": "https://example.com/avatar.png",
                    "bio": "Linux creator",
                    "public_repos": 10,
                    "followers": 1000,
                    "following": 0,
                    "created_at": "2011-09-03T00:00:00Z",
                },
                repos=[
                    {
                        "name": "linux",
                        "language": "C",
                        "stargazers_count": 50000,
                        "fork": False,
                        "description": "Linux kernel",
                        "topics": ["kernel", "os"],
                        "size": 5000,
                    }
                ],
                events=[{"type": "PushEvent", "created_at": datetime.now(timezone.utc).isoformat()}],
                readmes={"linux": "# Linux\n\nThe Linux kernel."},
            )
        )
        mock_groq.generate_feedback = AsyncMock(
            return_value={
                "feedback": "Great profile!",
                "suggestions": ["Keep going", "Add docs", "Diversify"],
            }
        )

        resp = await client.post(
            "/api/v1/analyze",
            json={"github_username": "torvalds"},
            cookies={"token": token},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["github_username"] == "torvalds"
        assert "scores" in data
        assert data["credits_remaining"] == 1

    @pytest.mark.asyncio
    @patch("app.services.analysis_service.GitHubService")
    @patch("app.services.analysis_service.GroqService")
    async def test_analyze_premium_unlimited(self, mock_groq, mock_github, client, db):
        user = await create_test_user(db, credits_remaining=0, is_premium=True)
        token = create_test_token(user)

        from app.services.github_service import GitHubData

        mock_github.fetch_user_data = AsyncMock(
            return_value=GitHubData(
                profile={
                    "login": "test",
                    "avatar_url": None,
                    "bio": None,
                    "public_repos": 1,
                    "followers": 0,
                    "following": 0,
                    "created_at": "2023-01-01T00:00:00Z",
                },
                repos=[{"name": "r", "language": "Python", "stargazers_count": 0, "fork": False, "description": "", "topics": [], "size": 10}],
                events=[],
                readmes={},
            )
        )
        mock_groq.generate_feedback = AsyncMock(return_value=None)

        resp = await client.post(
            "/api/v1/analyze",
            json={"github_username": "test"},
            cookies={"token": token},
        )
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_get_analysis_not_found(self, client, db):
        user = await create_test_user(db)
        token = create_test_token(user)
        fake_id = str(uuid.uuid4())
        resp = await client.get(f"/api/v1/analysis/{fake_id}", cookies={"token": token})
        assert resp.status_code == 404


class TestHistoryEndpoint:
    @pytest.mark.asyncio
    async def test_history_unauthenticated(self, client):
        resp = await client.get("/api/v1/history")
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_history_empty(self, client, db):
        user = await create_test_user(db)
        token = create_test_token(user)
        resp = await client.get("/api/v1/history", cookies={"token": token})
        assert resp.status_code == 200
        assert resp.json()["analyses"] == []

    @pytest.mark.asyncio
    async def test_history_with_analyses(self, client, db):
        user = await create_test_user(db)
        token = create_test_token(user)

        analysis = GitHubAnalysis(
            github_username="testuser",
            analysis_date="2024-01-01",
            avatar_url="https://example.com/avatar.png",
            score_overall=75.0,
            score_project_diversity=80.0,
            score_language_breadth=70.0,
            score_commit_consistency=85.0,
            score_readme_quality=60.0,
            score_community_engagement=65.0,
            score_originality=90.0,
            raw_data={"profile": {}, "repos_count": 5, "events_count": 10},
            expires_at=datetime(2025, 12, 31, tzinfo=timezone.utc),
        )
        db.add(analysis)
        await db.flush()

        link = UserAnalysis(user_id=user.id, analysis_id=analysis.id)
        db.add(link)
        await db.commit()

        resp = await client.get("/api/v1/history", cookies={"token": token})
        assert resp.status_code == 200
        data = resp.json()["analyses"]
        assert len(data) == 1
        assert data[0]["github_username"] == "testuser"
        assert data[0]["score_overall"] == 75.0
