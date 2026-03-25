import logging
from html import unescape
from re import sub as re_sub

import httpx

from app.schemas.jobs import Job
from app.services.job_adapters.base import JobAdapter
from app.utils.cache import TTLCache

logger = logging.getLogger(__name__)

_cache = TTLCache(default_ttl=43200)  # 12-hour cache

REMOTIVE_URL = "https://remotive.com/api/remote-jobs"


def _strip_html(text: str) -> str:
    """Remove HTML tags and decode entities."""
    return unescape(re_sub(r"<[^>]+>", " ", text)).strip()


def _truncate(text: str, length: int = 200) -> str:
    if len(text) <= length:
        return text
    return text[:length].rsplit(" ", 1)[0] + "..."


class RemotiveAdapter(JobAdapter):
    name = "remotive"
    cache_ttl = 43200  # 12 hours

    async def search(
        self,
        query: str,
        location: str | None = None,
        employment_type: str | None = None,
        remote_only: bool = False,
    ) -> list[Job]:
        cache_key = f"remotive:{query}:{employment_type}"
        cached = _cache.get(cache_key)
        if cached is not None:
            return cached

        try:
            # Remotive search works best with single keywords
            # Use the most specific keyword from the query
            search_term = query.split()[0] if query.strip() else query
            params = {"search": search_term, "limit": 25}

            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(REMOTIVE_URL, params=params)
                resp.raise_for_status()
                data = resp.json()

            raw_jobs = data.get("jobs", [])
            # Post-filter: match all query words in title/company/description
            query_words = query.lower().split()
            jobs = []
            for item in raw_jobs:
                # Filter by query relevance (all words must appear somewhere)
                item_text = f"{item.get('title', '')} {item.get('company_name', '')} {item.get('description', '')}".lower()
                if len(query_words) > 1 and not all(w in item_text for w in query_words):
                    continue

                # Filter by employment type if specified
                if employment_type:
                    job_type = (item.get("job_type") or "").lower().replace("_", "-")
                    if employment_type.lower() not in job_type and job_type not in employment_type.lower():
                        continue

                description = _strip_html(item.get("description", ""))
                date_raw = item.get("publication_date", "")
                date_posted = date_raw[:10] if date_raw else "Recent"

                jobs.append(Job(
                    title=item.get("title", "Untitled"),
                    company=item.get("company_name", "Unknown"),
                    location=item.get("candidate_required_location", "Remote"),
                    date_posted=date_posted,
                    employment_type=item.get("job_type"),
                    is_remote=True,
                    description_snippet=_truncate(description),
                    apply_url=item.get("url", "#"),
                    company_logo=item.get("company_logo"),
                    source="remotive",
                ))

            _cache.set(cache_key, jobs)
            return jobs

        except Exception:
            logger.exception("Remotive API call failed")
            return []
