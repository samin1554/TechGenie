import logging

import httpx

from app.config import settings
from app.schemas.jobs import Job, JobsResponse
from app.utils.cache import TTLCache

logger = logging.getLogger(__name__)

JSEARCH_URL = "https://jsearch.p.rapidapi.com/search"

# 1-hour cache for job results
_jobs_cache = TTLCache(default_ttl=3600)


class JobsService:
    @staticmethod
    async def search(
        query: str,
        location: str | None = None,
        employment_type: str | None = None,
        remote_only: bool = False,
        page: int = 1,
    ) -> JobsResponse:
        cache_key = f"jobs:{query}:{location}:{employment_type}:{remote_only}:{page}"
        cached = _jobs_cache.get(cache_key)
        if cached:
            return cached

        if not settings.rapidapi_key:
            logger.warning("No RapidAPI key configured")
            return JobsResponse(jobs=[], total=0, page=page, has_more=False)

        params: dict = {
            "query": query,
            "page": str(page),
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
            total = data.get("total", len(raw_jobs)) if isinstance(data.get("total"), int) else len(raw_jobs)

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
                ))

            result = JobsResponse(
                jobs=jobs,
                total=total,
                page=page,
                has_more=len(raw_jobs) >= 10,
            )

            _jobs_cache.set(cache_key, result)
            return result

        except Exception:
            logger.exception("JSearch API call failed")
            return JobsResponse(jobs=[], total=0, page=page, has_more=False)
