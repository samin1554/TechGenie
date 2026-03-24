import asyncio
import base64
from dataclasses import dataclass

import httpx

from app.config import settings


class GitHubUserNotFoundError(Exception):
    pass


class GitHubRateLimitError(Exception):
    pass


@dataclass
class GitHubData:
    profile: dict
    repos: list[dict]
    events: list[dict]
    readmes: dict[str, str]


class GitHubService:
    BASE_URL = "https://api.github.com"

    @staticmethod
    def _headers() -> dict[str, str]:
        headers = {"Accept": "application/vnd.github.v3+json"}
        if settings.github_token:
            headers["Authorization"] = f"Bearer {settings.github_token}"
        return headers

    @staticmethod
    async def fetch_user_data(username: str) -> GitHubData:
        async with httpx.AsyncClient(
            base_url=GitHubService.BASE_URL,
            headers=GitHubService._headers(),
            timeout=15.0,
        ) as client:
            profile, repos, events = await asyncio.gather(
                GitHubService._fetch_profile(client, username),
                GitHubService._fetch_repos(client, username),
                GitHubService._fetch_events(client, username),
            )

            top_repos = GitHubService._get_top_repos(repos, n=5)
            readme_tasks = [
                GitHubService._fetch_readme(client, username, repo["name"])
                for repo in top_repos
            ]
            readme_results = await asyncio.gather(*readme_tasks, return_exceptions=True)

            readmes = {}
            for repo, result in zip(top_repos, readme_results):
                if isinstance(result, str):
                    readmes[repo["name"]] = result

            return GitHubData(profile=profile, repos=repos, events=events, readmes=readmes)

    @staticmethod
    async def _fetch_profile(client: httpx.AsyncClient, username: str) -> dict:
        resp = await client.get(f"/users/{username}")
        if resp.status_code == 404:
            raise GitHubUserNotFoundError(f"GitHub user '{username}' not found")
        if resp.status_code == 403:
            raise GitHubRateLimitError("GitHub API rate limit exceeded")
        resp.raise_for_status()
        return resp.json()

    @staticmethod
    async def _fetch_repos(client: httpx.AsyncClient, username: str) -> list[dict]:
        resp = await client.get(
            f"/users/{username}/repos",
            params={"per_page": 100, "sort": "updated"},
        )
        if resp.status_code == 403:
            raise GitHubRateLimitError("GitHub API rate limit exceeded")
        resp.raise_for_status()
        return resp.json()

    @staticmethod
    async def _fetch_events(client: httpx.AsyncClient, username: str) -> list[dict]:
        resp = await client.get(
            f"/users/{username}/events",
            params={"per_page": 100},
        )
        if resp.status_code == 403:
            raise GitHubRateLimitError("GitHub API rate limit exceeded")
        resp.raise_for_status()
        return resp.json()

    @staticmethod
    async def _fetch_readme(client: httpx.AsyncClient, owner: str, repo: str) -> str:
        resp = await client.get(f"/repos/{owner}/{repo}/readme")
        if resp.status_code != 200:
            return ""
        data = resp.json()
        content = data.get("content", "")
        if content:
            return base64.b64decode(content).decode("utf-8", errors="replace")
        return ""

    @staticmethod
    def _get_top_repos(repos: list[dict], n: int = 5) -> list[dict]:
        non_forks = [r for r in repos if not r.get("fork")]
        sorted_repos = sorted(
            non_forks, key=lambda r: r.get("stargazers_count", 0), reverse=True
        )
        return sorted_repos[:n]
