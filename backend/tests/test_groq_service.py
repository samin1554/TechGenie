import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.groq_service import GroqService


@pytest.fixture
def sample_args():
    return {
        "username": "testuser",
        "scores": {
            "overall": 72.5,
            "project_diversity": 80,
            "language_breadth": 65,
            "commit_consistency": 90,
            "readme_quality": 55,
            "community_engagement": 70,
            "originality": 85,
        },
        "top_repos": [
            {"name": "cool-project", "language": "Python", "stars": 10},
            {"name": "web-app", "language": "TypeScript", "stars": 5},
        ],
        "top_languages": ["Python", "TypeScript", "Go"],
        "account_age_days": 730,
    }


class TestGroqService:
    @pytest.mark.asyncio
    @patch("app.services.groq_service.httpx.AsyncClient")
    @patch("app.services.groq_service.settings")
    async def test_generates_feedback(self, mock_settings, mock_client_class, sample_args):
        mock_settings.groq_api_key = "test-key"
        mock_client = AsyncMock()
        mock_client_class.return_value.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client_class.return_value.__aexit__ = AsyncMock(return_value=False)

        response_content = {
            "feedback": "Your profile shows strong commit consistency.",
            "suggestions": [
                "Add more README documentation",
                "Diversify project types",
                "Contribute to open source",
            ],
        }

        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            "choices": [{"message": {"content": json.dumps(response_content)}}]
        }
        mock_resp.raise_for_status = MagicMock()
        mock_client.post.return_value = mock_resp

        result = await GroqService.generate_feedback(**sample_args)
        assert result is not None
        assert "feedback" in result
        assert len(result["suggestions"]) == 3

    @pytest.mark.asyncio
    @patch("app.services.groq_service.httpx.AsyncClient")
    @patch("app.services.groq_service.settings")
    async def test_timeout_fallback(self, mock_settings, mock_client_class, sample_args):
        mock_settings.groq_api_key = "test-key"
        mock_client = AsyncMock()
        mock_client_class.return_value.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client_class.return_value.__aexit__ = AsyncMock(return_value=False)
        mock_client.post.side_effect = Exception("Connection timeout")

        result = await GroqService.generate_feedback(**sample_args)
        assert result is None

    @pytest.mark.asyncio
    @patch("app.services.groq_service.httpx.AsyncClient")
    @patch("app.services.groq_service.settings")
    async def test_invalid_json_fallback(self, mock_settings, mock_client_class, sample_args):
        mock_settings.groq_api_key = "test-key"
        mock_client = AsyncMock()
        mock_client_class.return_value.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client_class.return_value.__aexit__ = AsyncMock(return_value=False)

        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            "choices": [{"message": {"content": "not valid json"}}]
        }
        mock_resp.raise_for_status = MagicMock()
        mock_client.post.return_value = mock_resp

        result = await GroqService.generate_feedback(**sample_args)
        assert result is None

    @pytest.mark.asyncio
    async def test_no_api_key(self, sample_args):
        with patch("app.services.groq_service.settings") as mock_settings:
            mock_settings.groq_api_key = ""
            result = await GroqService.generate_feedback(**sample_args)
            assert result is None
