import asyncio
import logging

from app.schemas.jobs import Job, JobsResponse
from app.services.job_adapters import (
    AdzunaAdapter,
    HNHiringAdapter,
    JSearchAdapter,
    RemotiveAdapter,
)
from app.utils.cache import TTLCache

logger = logging.getLogger(__name__)

# Aggregated result cache (1 hour)
_agg_cache = TTLCache(default_ttl=3600)

# Adapter instances (free sources first, paid last)
_FREE_ADAPTERS = [RemotiveAdapter(), AdzunaAdapter(), HNHiringAdapter()]
_JSEARCH_ADAPTER = JSearchAdapter()

# Only use JSearch fallback if free sources return fewer than this
MIN_RESULTS_BEFORE_FALLBACK = 5

PAGE_SIZE = 10

# Source priority for sorting (lower = preferred)
_SOURCE_PRIORITY = {"adzuna": 0, "remotive": 1, "jsearch": 2, "hn_hiring": 3}


def _dedup_jobs(jobs: list[Job]) -> list[Job]:
    """Deduplicate by normalized (title, company)."""
    seen: dict[tuple[str, str], Job] = {}
    for job in jobs:
        key = (job.title.lower().strip(), job.company.lower().strip())
        if key not in seen or (seen[key].apply_url == "#" and job.apply_url != "#"):
            seen[key] = job
    return list(seen.values())


def _sort_jobs(jobs: list[Job]) -> list[Job]:
    """Sort by date (recent first), then source priority."""
    def sort_key(j: Job):
        # Put "Recent" and empty dates last
        date = j.date_posted if j.date_posted and j.date_posted != "Recent" else "0000-00-00"
        priority = _SOURCE_PRIORITY.get(j.source, 99)
        return (-ord(date[0]) if date else 0, date, priority)

    # Simple sort: by date descending, then source priority
    return sorted(jobs, key=lambda j: (
        -(j.date_posted or "0") if j.date_posted != "Recent" else "",
        _SOURCE_PRIORITY.get(j.source, 99),
    ), reverse=False)


class JobsService:
    @staticmethod
    async def search(
        query: str,
        location: str | None = None,
        employment_type: str | None = None,
        remote_only: bool = False,
        page: int = 1,
    ) -> JobsResponse:
        # Normalize for caching
        cache_key = f"agg:{query.lower().strip()}:{location}:{employment_type}:{remote_only}"
        cached = _agg_cache.get(cache_key)

        if cached is None:
            # Gather from free adapters concurrently
            available = [a for a in _FREE_ADAPTERS if a.is_available()]
            tasks = [
                a.search(query, location, employment_type, remote_only)
                for a in available
            ]

            results = await asyncio.gather(*tasks, return_exceptions=True)

            all_jobs: list[Job] = []
            for i, result in enumerate(results):
                if isinstance(result, list):
                    all_jobs.extend(result)
                else:
                    logger.warning(
                        "Adapter %s failed: %s",
                        available[i].name,
                        result,
                    )

            # Fallback to JSearch if not enough results
            if len(all_jobs) < MIN_RESULTS_BEFORE_FALLBACK and _JSEARCH_ADAPTER.is_available():
                try:
                    jsearch_jobs = await _JSEARCH_ADAPTER.search(
                        query, location, employment_type, remote_only
                    )
                    all_jobs.extend(jsearch_jobs)
                    logger.info("JSearch fallback added %d jobs", len(jsearch_jobs))
                except Exception:
                    logger.exception("JSearch fallback failed")

            # Deduplicate and sort
            all_jobs = _dedup_jobs(all_jobs)
            all_jobs.sort(
                key=lambda j: (
                    j.date_posted if j.date_posted and j.date_posted != "Recent" else "0000-00-00",
                    -_SOURCE_PRIORITY.get(j.source, 99),
                ),
                reverse=True,
            )

            _agg_cache.set(cache_key, all_jobs)
            cached = all_jobs

        # Paginate
        total = len(cached)
        start = (page - 1) * PAGE_SIZE
        end = start + PAGE_SIZE
        page_jobs = cached[start:end]

        return JobsResponse(
            jobs=page_jobs,
            total=total,
            page=page,
            has_more=end < total,
        )
