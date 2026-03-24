import base64
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.github_service import (
    GitHubRateLimitError,
    GitHubService,
    GitHubUserNotFoundError,
)


@pytest.fixture
def mock_client():
    client = AsyncMock()
    return client


def make_response(status_code=200, json_data=None):
    resp = MagicMock()
    resp.status_code = status_code
    resp.json.return_value = json_data or {}
    if status_code >= 400:
        resp.raise_for_status.side_effect = Exception(f"HTTP {status_code}")
    return resp


class TestFetchProfile:
    @pytest.mark.asyncio
    async def test_success(self, mock_client):
        profile_data = {"login": "testuser", "id": 123, "followers": 50}
        mock_client.get.return_value = make_response(200, profile_data)
        result = await GitHubService._fetch_profile(mock_client, "testuser")
        assert result["login"] == "testuser"
        assert result["followers"] == 50

    @pytest.mark.asyncio
    async def test_user_not_found(self, mock_client):
        mock_client.get.return_value = make_response(404)
        with pytest.raises(GitHubUserNotFoundError):
            await GitHubService._fetch_profile(mock_client, "nonexistent")

    @pytest.mark.asyncio
    async def test_rate_limited(self, mock_client):
        mock_client.get.return_value = make_response(403)
        with pytest.raises(GitHubRateLimitError):
            await GitHubService._fetch_profile(mock_client, "testuser")


class TestFetchRepos:
    @pytest.mark.asyncio
    async def test_success(self, mock_client):
        repos = [
            {"name": "repo1", "language": "Python", "stargazers_count": 10, "fork": False},
            {"name": "repo2", "language": "Go", "stargazers_count": 5, "fork": True},
        ]
        mock_client.get.return_value = make_response(200, repos)
        result = await GitHubService._fetch_repos(mock_client, "testuser")
        assert len(result) == 2
        assert result[0]["name"] == "repo1"

    @pytest.mark.asyncio
    async def test_rate_limited(self, mock_client):
        mock_client.get.return_value = make_response(403)
        with pytest.raises(GitHubRateLimitError):
            await GitHubService._fetch_repos(mock_client, "testuser")


class TestFetchEvents:
    @pytest.mark.asyncio
    async def test_success(self, mock_client):
        events = [{"type": "PushEvent", "created_at": "2024-01-01T00:00:00Z"}]
        mock_client.get.return_value = make_response(200, events)
        result = await GitHubService._fetch_events(mock_client, "testuser")
        assert len(result) == 1
        assert result[0]["type"] == "PushEvent"


class TestFetchReadme:
    @pytest.mark.asyncio
    async def test_success(self, mock_client):
        content = base64.b64encode(b"# My Project\n\nHello world").decode()
        mock_client.get.return_value = make_response(200, {"content": content})
        result = await GitHubService._fetch_readme(mock_client, "testuser", "repo1")
        assert "# My Project" in result

    @pytest.mark.asyncio
    async def test_no_readme(self, mock_client):
        mock_client.get.return_value = make_response(404)
        result = await GitHubService._fetch_readme(mock_client, "testuser", "repo1")
        assert result == ""


class TestGetTopRepos:
    def test_returns_top_n_non_forks(self):
        repos = [
            {"name": "a", "stargazers_count": 5, "fork": False},
            {"name": "b", "stargazers_count": 50, "fork": False},
            {"name": "c", "stargazers_count": 100, "fork": True},
            {"name": "d", "stargazers_count": 20, "fork": False},
        ]
        top = GitHubService._get_top_repos(repos, n=2)
        assert len(top) == 2
        assert top[0]["name"] == "b"
        assert top[1]["name"] == "d"
