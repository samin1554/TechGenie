"""
Fetches top tech stories from HackerNews and rewrites them as
editorial-style headlines using Groq. Results are cached for 24 hours.
"""

import json
import logging
import time
from datetime import datetime

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

# In-memory cache: { "editorials": [...], "ticker": [...], "fetched_at": timestamp }
_cache: dict | None = None
CACHE_TTL = 60 * 60 * 24  # 24 hours

HN_TOP_URL = "https://hacker-news.firebaseio.com/v0/topstories.json"
HN_ITEM_URL = "https://hacker-news.firebaseio.com/v0/item/{id}.json"

# How many HN stories to fetch as candidates
FETCH_COUNT = 30
# How many editorials to return
EDITORIAL_COUNT = 5
# How many ticker items to return
TICKER_COUNT = 8


def _format_date(unix_ts: int) -> str:
    """Format unix timestamp to 'Mar 23' style."""
    dt = datetime.fromtimestamp(unix_ts)
    return dt.strftime("%b %d").replace(" 0", " ")


async def _fetch_hn_stories() -> list[dict]:
    """Fetch top HN stories with title, url, score, time."""
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(HN_TOP_URL)
        resp.raise_for_status()
        story_ids = resp.json()[:FETCH_COUNT]

        stories = []
        for sid in story_ids:
            try:
                r = await client.get(HN_ITEM_URL.format(id=sid))
                item = r.json()
                if item and item.get("type") == "story" and item.get("title"):
                    stories.append({
                        "title": item["title"],
                        "url": item.get("url", f"https://news.ycombinator.com/item?id={sid}"),
                        "score": item.get("score", 0),
                        "time": item.get("time", int(time.time())),
                    })
            except Exception:
                continue

        # Sort by score descending → pick the best
        stories.sort(key=lambda s: s["score"], reverse=True)
        return stories


async def _rewrite_headlines(stories: list[dict]) -> list[dict]:
    """Use Groq to rewrite HN titles as newspaper editorials."""
    if not settings.groq_api_key or not stories:
        # Fallback: use raw titles
        return [
            {
                "date": _format_date(s["time"]),
                "title": s["title"],
                "byline": "By Hacker News",
                "url": s["url"],
            }
            for s in stories[:EDITORIAL_COUNT]
        ]

    titles_block = "\n".join(
        f"{i+1}. {s['title']}" for i, s in enumerate(stories[:EDITORIAL_COUNT * 2])
    )

    prompt = f"""You are an editorial headline writer for a prestigious tech newspaper called "The Digital Broadsheet".

Rewrite these tech news headlines into compelling, authoritative newspaper-style editorial headlines.
Make them punchy, dramatic, and professional — like front-page NYT tech section headlines.
Also generate a creative byline for each (e.g. "By Senior Technology Correspondent", "By Engineering Intelligence Desk", "By Open-Source Affairs Editor").

Headlines to rewrite:
{titles_block}

Return ONLY a JSON array of the top {EDITORIAL_COUNT} best ones:
[
  {{"title": "rewritten headline", "byline": "By ...", "index": original_1_based_index}},
  ...
]

Return ONLY the JSON array, no markdown, no explanation."""

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.groq_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.7,
                    "max_tokens": 1024,
                },
            )
            resp.raise_for_status()
            content = resp.json()["choices"][0]["message"]["content"].strip()

            # Parse JSON from response (handle markdown code blocks)
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]

            items = json.loads(content)
            results = []
            for item in items[:EDITORIAL_COUNT]:
                idx = item.get("index", 1) - 1
                source_story = stories[idx] if idx < len(stories) else stories[0]
                results.append({
                    "date": _format_date(source_story["time"]),
                    "title": item["title"],
                    "byline": item.get("byline", "By Engineering Intelligence Desk"),
                    "url": source_story["url"],
                })
            return results

    except Exception as e:
        logger.warning(f"Groq rewrite failed, using raw titles: {e}")
        return [
            {
                "date": _format_date(s["time"]),
                "title": s["title"],
                "byline": "By Hacker News",
                "url": s["url"],
            }
            for s in stories[:EDITORIAL_COUNT]
        ]


class NewsService:
    @staticmethod
    async def get_editorials() -> dict:
        """Return cached editorials or fetch fresh ones."""
        global _cache

        now = time.time()
        if _cache and (now - _cache["fetched_at"]) < CACHE_TTL:
            return _cache

        try:
            stories = await _fetch_hn_stories()

            editorials = await _rewrite_headlines(stories)

            # Ticker: short one-line items from remaining stories
            ticker = [s["title"] for s in stories[EDITORIAL_COUNT:EDITORIAL_COUNT + TICKER_COUNT]]

            _cache = {
                "editorials": editorials,
                "ticker": ticker,
                "fetched_at": now,
            }
            return _cache

        except Exception as e:
            logger.error(f"Failed to fetch news: {e}")
            # Return stale cache if available
            if _cache:
                return _cache
            # Ultimate fallback
            return {
                "editorials": [
                    {
                        "date": datetime.now().strftime("%b %d").replace(" 0", " "),
                        "title": "The Open-Source Renaissance Continues to Reshape Enterprise Software",
                        "byline": "By Engineering Intelligence Desk",
                        "url": None,
                    }
                ],
                "ticker": ["Welcome to TechGenie — The Digital Broadsheet"],
                "fetched_at": now,
            }
