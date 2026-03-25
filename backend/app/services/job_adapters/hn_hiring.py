import logging
from html import unescape
from re import sub as re_sub

import httpx

from app.schemas.jobs import Job
from app.services.job_adapters.base import JobAdapter
from app.utils.cache import TTLCache

logger = logging.getLogger(__name__)

_cache = TTLCache(default_ttl=86400)  # 24-hour cache

HN_USER_URL = "https://hacker-news.firebaseio.com/v0/user/whoishiring.json"
HN_ITEM_URL = "https://hacker-news.firebaseio.com/v0/item/{id}.json"

# Max comments to fetch from the hiring thread
MAX_COMMENTS = 80


def _strip_html(text: str) -> str:
    """Remove HTML tags and decode entities."""
    return unescape(re_sub(r"<[^>]+>", " ", text)).strip()


def _truncate(text: str, length: int = 200) -> str:
    if len(text) <= length:
        return text
    return text[:length].rsplit(" ", 1)[0] + "..."


def _parse_hn_comment(comment: dict) -> Job | None:
    """
    Parse an HN Who's Hiring comment into a Job.
    Convention: Company | Title | Location | Remote/Onsite | ...
    """
    raw_text = comment.get("text", "")
    if not raw_text or comment.get("deleted") or comment.get("dead"):
        return None

    clean_text = _strip_html(raw_text)
    lines = clean_text.split("\n")
    first_line = lines[0] if lines else clean_text

    # Try to parse the pipe-separated header
    parts = [p.strip() for p in first_line.split("|")]

    if len(parts) >= 2:
        company = parts[0]
        title = parts[1]
        location = parts[2] if len(parts) >= 3 else "Not specified"
    else:
        # Fallback: use the first line as title, no company
        company = "Unknown"
        title = first_line[:100] if first_line else "Untitled"
        location = "Not specified"

    # Detect remote
    text_lower = clean_text.lower()
    is_remote = any(kw in text_lower for kw in ["remote", "wfh", "work from home", "distributed"])

    # Skip very short comments (likely not job posts)
    if len(clean_text) < 30:
        return None

    # Description: everything after the first line
    description = " ".join(lines[1:]).strip() if len(lines) > 1 else clean_text

    comment_id = comment.get("id", "")
    return Job(
        title=title[:150],
        company=company[:100],
        location=location[:100],
        date_posted="Recent",
        employment_type=None,
        is_remote=is_remote,
        description_snippet=_truncate(description),
        apply_url=f"https://news.ycombinator.com/item?id={comment_id}",
        company_logo=None,
        source="hn_hiring",
    )


class HNHiringAdapter(JobAdapter):
    name = "hn_hiring"
    cache_ttl = 86400  # 24 hours

    async def search(
        self,
        query: str,
        location: str | None = None,
        employment_type: str | None = None,
        remote_only: bool = False,
    ) -> list[Job]:
        cache_key = "hn_hiring:all_jobs"
        all_jobs = _cache.get(cache_key)

        if all_jobs is None:
            all_jobs = await self._fetch_all_jobs()
            if all_jobs:
                _cache.set(cache_key, all_jobs)

        # Filter by query
        query_lower = query.lower()
        filtered = [
            j for j in all_jobs
            if query_lower in j.title.lower()
            or query_lower in j.company.lower()
            or query_lower in j.description_snippet.lower()
        ]

        # Filter by location
        if location:
            loc_lower = location.lower()
            filtered = [j for j in filtered if loc_lower in j.location.lower()]

        # Filter by remote
        if remote_only:
            filtered = [j for j in filtered if j.is_remote]

        return filtered[:20]

    async def _fetch_all_jobs(self) -> list[Job]:
        """Fetch and parse the latest Who is hiring thread."""
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                # Get whoishiring user's submissions
                resp = await client.get(HN_USER_URL)
                resp.raise_for_status()
                user_data = resp.json()

                submitted = user_data.get("submitted", [])
                if not submitted:
                    return []

                # Find the latest "Who is hiring?" thread
                hiring_story_id = None
                for story_id in submitted[:10]:  # Check recent submissions
                    r = await client.get(HN_ITEM_URL.format(id=story_id))
                    item = r.json()
                    if item and "who is hiring" in (item.get("title", "")).lower():
                        hiring_story_id = story_id
                        break

                if not hiring_story_id:
                    # Fallback: just use the first submission
                    hiring_story_id = submitted[0]

                # Fetch the story to get comment IDs
                r = await client.get(HN_ITEM_URL.format(id=hiring_story_id))
                story = r.json()
                comment_ids = story.get("kids", [])[:MAX_COMMENTS]

                # Fetch comments and parse
                jobs = []
                for cid in comment_ids:
                    try:
                        r = await client.get(HN_ITEM_URL.format(id=cid))
                        comment = r.json()
                        if comment:
                            job = _parse_hn_comment(comment)
                            if job:
                                jobs.append(job)
                    except Exception:
                        continue

                logger.info("Fetched %d jobs from HN Who's Hiring", len(jobs))
                return jobs

        except Exception:
            logger.exception("HN Who's Hiring fetch failed")
            return []
