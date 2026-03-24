from unittest.mock import AsyncMock, MagicMock, patch

import jwt
import pytest

from app.config import settings
from app.services.auth_service import AuthService
from tests.conftest import create_expired_token, create_test_token, create_test_user


class TestGitHubOAuthRedirect:
    @pytest.mark.asyncio
    async def test_github_redirect_url(self, client):
        resp = await client.get("/api/v1/auth/github")
        assert resp.status_code == 200
        data = resp.json()
        assert "redirect_url" in data
        url = data["redirect_url"]
        assert "github.com/login/oauth/authorize" in url
        assert f"client_id={settings.github_client_id}" in url
        assert "scope=read:user,user:email" in url
        assert "state=" in url

    @pytest.mark.asyncio
    async def test_google_redirect_url(self, client):
        resp = await client.get("/api/v1/auth/google")
        assert resp.status_code == 200
        data = resp.json()
        url = data["redirect_url"]
        assert "accounts.google.com" in url
        assert f"client_id={settings.google_client_id}" in url


class TestGitHubCallback:
    @pytest.mark.asyncio
    @patch("app.services.auth_service.httpx.AsyncClient")
    async def test_github_callback_new_user(self, mock_client_class, client, db):
        state = AuthService._generate_state()

        mock_http = AsyncMock()
        mock_client_class.return_value.__aenter__ = AsyncMock(return_value=mock_http)
        mock_client_class.return_value.__aexit__ = AsyncMock(return_value=False)

        mock_token_resp = MagicMock()
        mock_token_resp.json.return_value = {"access_token": "gho_test123"}

        mock_user_resp = MagicMock()
        mock_user_resp.json.return_value = {
            "id": 12345,
            "login": "newuser",
            "name": "New User",
            "email": "new@example.com",
            "avatar_url": "https://avatars.githubusercontent.com/u/12345",
        }

        mock_email_resp = MagicMock()
        mock_email_resp.json.return_value = [
            {"email": "primary@example.com", "primary": True, "verified": True}
        ]

        mock_http.post.return_value = mock_token_resp
        mock_http.get.side_effect = [mock_user_resp, mock_email_resp]

        resp = await client.post(
            "/api/v1/auth/github/callback",
            json={"code": "test_code", "state": state},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["user"]["github_username"] == "newuser"
        assert data["user"]["credits_remaining"] == 2
        assert data["user"]["is_premium"] is False

    @pytest.mark.asyncio
    async def test_csrf_state_mismatch(self, client):
        resp = await client.post(
            "/api/v1/auth/github/callback",
            json={"code": "test_code", "state": "invalid-state"},
        )
        assert resp.status_code == 403


class TestAuthMe:
    @pytest.mark.asyncio
    async def test_auth_me_valid_token(self, client, db):
        user = await create_test_user(db)
        token = create_test_token(user)
        resp = await client.get("/api/v1/auth/me", cookies={"token": token})
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == user.email
        assert data["credits_remaining"] == 2

    @pytest.mark.asyncio
    async def test_auth_me_expired_token(self, client, db):
        user = await create_test_user(db)
        token = create_expired_token(user)
        resp = await client.get("/api/v1/auth/me", cookies={"token": token})
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_auth_me_no_token(self, client):
        resp = await client.get("/api/v1/auth/me")
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_auth_me_tampered_token(self, client):
        payload = {"user_id": str("00000000-0000-0000-0000-000000000000"), "exp": 9999999999}
        token = jwt.encode(payload, "wrong-secret", algorithm="HS256")
        resp = await client.get("/api/v1/auth/me", cookies={"token": token})
        assert resp.status_code == 401


class TestLogout:
    @pytest.mark.asyncio
    async def test_logout(self, client, db):
        user = await create_test_user(db)
        token = create_test_token(user)
        resp = await client.post("/api/v1/auth/logout", cookies={"token": token})
        assert resp.status_code == 200
        assert resp.json()["message"] == "Logged out"
