import logging

import httpx

from app.config import settings
from app.schemas.jobs import Job
from app.services.job_adapters.base import JobAdapter
from app.utils.cache import TTLCache

logger = logging.getLogger(__name__)

_cache = TTLCache(default_ttl=43200)  # 12-hour cache (up from 1h)

JSEARCH_URL = "https://jsearch.p.rapidapi.com/search"


class JSearchAdapter(JobAdapter):
    name = "jsearch"
    cache_ttl = 43200  # 12 hours

    def is_available(self) -> bool:
        return bool(settings.rapidapi_key)

    async def search(
        self,
        query: str,
        location: str | None = None,
        employment_type: str | None = None,
        remote_only: bool = False,
    ) -> list[Job]:
        cache_key = f"jsearch:{query}:{location}:{employment_type}:{remote_only}"
        cached = _cache.get(cache_key)
        if cached is not None:
            return cached

        params: dict = {
            "query": query,
            "page": "1",
            "num_pages": "1",
            "date_posted": "week",
        }

        if location:
            params["query"] = f"{query} in {location}"
        if remote_only:
            params["remote_jobs_only"] = "true"
        if employment_type:
            type_map = {
                "full-time": "FULLTIME",
                "part-time": "PARTTIME",
                "internship": "INTERN",
                "contract": "CONTRACTOR",
            }
            mapped = type_map.get(employment_type.lower())
            if mapped:
                params["employment_types"] = mapped

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(
                    JSEARCH_URL,
                    params=params,
                    headers={
                        "X-RapidAPI-Key": settings.rapidapi_key,
                        "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
                    },
                )
                resp.raise_for_status()
                data = resp.json()

            raw_jobs = data.get("data", [])
            jobs = []
            for item in raw_jobs:
                description = item.get("job_description", "") or ""
                snippet = description[:200].rsplit(" ", 1)[0] + "..." if len(description) > 200 else description

                jobs.append(Job(
                    title=item.get("job_title", "Untitled"),
                    company=item.get("employer_name", "Unknown"),
                    location=item.get("job_city", item.get("job_state", "")) or "Not specified",
                    date_posted=item.get("job_posted_at_datetime_utc", "")[:10] if item.get("job_posted_at_datetime_utc") else "Recent",
                    employment_type=item.get("job_employment_type"),
                    is_remote=item.get("job_is_remote", False),
                    description_snippet=snippet,
                    apply_url=item.get("job_apply_link") or item.get("job_google_link", "#"),
                    company_logo=item.get("employer_logo"),
                    source="jsearch",
                ))

            _cache.set(cache_key, jobs)
            return jobs

        except Exception:
            logger.exception("JSearch API call failed")
            return []
