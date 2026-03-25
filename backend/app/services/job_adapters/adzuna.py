import logging

import httpx

from app.config import settings
from app.schemas.jobs import Job
from app.services.job_adapters.base import JobAdapter
from app.utils.cache import TTLCache

logger = logging.getLogger(__name__)

_cache = TTLCache(default_ttl=21600)  # 6-hour cache

ADZUNA_URL = "https://api.adzuna.com/v1/api/jobs/{country}/search/1"


def _truncate(text: str, length: int = 200) -> str:
    if len(text) <= length:
        return text
    return text[:length].rsplit(" ", 1)[0] + "..."


def _detect_remote(title: str, description: str) -> bool:
    text = f"{title} {description}".lower()
    return any(kw in text for kw in ["remote", "work from home", "wfh", "distributed"])


class AdzunaAdapter(JobAdapter):
    name = "adzuna"
    cache_ttl = 21600  # 6 hours

    def is_available(self) -> bool:
        return bool(settings.adzuna_app_id and settings.adzuna_app_key)

    async def search(
        self,
        query: str,
        location: str | None = None,
        employment_type: str | None = None,
        remote_only: bool = False,
    ) -> list[Job]:
        cache_key = f"adzuna:{query}:{location}:{employment_type}:{remote_only}"
        cached = _cache.get(cache_key)
        if cached is not None:
            return cached

        try:
            # Default to US
            country = "us"

            params: dict = {
                "app_id": settings.adzuna_app_id,
                "app_key": settings.adzuna_app_key,
                "what": query,
                "results_per_page": 20,
                "content-type": "application/json",
            }

            if location:
                params["where"] = location

            if employment_type:
                type_map = {
                    "full-time": "full_time",
                    "part-time": "part_time",
                    "internship": "internship",
                    "contract": "contract",
                }
                mapped = type_map.get(employment_type.lower())
                if mapped:
                    params["what_and"] = mapped

            url = ADZUNA_URL.format(country=country)

            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(url, params=params)
                resp.raise_for_status()
                data = resp.json()

            raw_jobs = data.get("results", [])
            jobs = []
            for item in raw_jobs:
                title = item.get("title", "Untitled")
                description = item.get("description", "")
                is_remote = _detect_remote(title, description)

                if remote_only and not is_remote:
                    continue

                date_raw = item.get("created", "")
                date_posted = date_raw[:10] if date_raw else "Recent"

                company_data = item.get("company", {})
                company_name = company_data.get("display_name", "Unknown") if isinstance(company_data, dict) else "Unknown"

                location_data = item.get("location", {})
                loc = location_data.get("display_name", "Not specified") if isinstance(location_data, dict) else "Not specified"

                contract_type = item.get("contract_type")

                jobs.append(Job(
                    title=title,
                    company=company_name,
                    location=loc,
                    date_posted=date_posted,
                    employment_type=contract_type,
                    is_remote=is_remote,
                    description_snippet=_truncate(description),
                    apply_url=item.get("redirect_url", "#"),
                    company_logo=None,
                    source="adzuna",
                ))

            _cache.set(cache_key, jobs)
            return jobs

        except Exception:
            logger.exception("Adzuna API call failed")
            return []
