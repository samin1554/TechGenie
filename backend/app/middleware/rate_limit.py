import time
from collections import defaultdict

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse


# Path prefix → requests per minute
_RATE_LIMITS: dict[str, int] = {
    "/api/v1/auth": 10,
    "/api/v1/analyze": 10,
    "/api/v1/cover-letter": 10,
    "/api/v1/skill-gap": 10,
    "/api/v1/linkedin": 10,
    "/api/v1/resume/generate": 10,
    "/api/v1/jobs": 20,
    "/api/v1/news": 60,
    "/api/v1/health": 60,
}
_DEFAULT_LIMIT = 30


def _get_limit(path: str) -> int:
    for prefix, limit in _RATE_LIMITS.items():
        if path.startswith(prefix):
            return limit
    return _DEFAULT_LIMIT


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, **kwargs):
        super().__init__(app, **kwargs)
        # {ip: [(timestamp, path_prefix), ...]}
        self._requests: dict[str, list[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        path = request.url.path
        limit = _get_limit(path)
        now = time.time()
        window = 60.0  # 1 minute

        # Get the bucket key: IP + rate limit category
        bucket_key = f"{client_ip}:{_get_limit_prefix(path)}"

        # Clean old entries and count recent requests
        self._requests[bucket_key] = [
            ts for ts in self._requests[bucket_key] if now - ts < window
        ]

        if len(self._requests[bucket_key]) >= limit:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please slow down."},
                headers={"Retry-After": "60"},
            )

        self._requests[bucket_key].append(now)

        # Periodically clean stale buckets to prevent memory growth
        if len(self._requests) > 10000:
            self._cleanup(now, window)

        return await call_next(request)

    def _cleanup(self, now: float, window: float):
        stale = [
            key for key, timestamps in self._requests.items()
            if not timestamps or now - timestamps[-1] > window
        ]
        for key in stale:
            del self._requests[key]


def _get_limit_prefix(path: str) -> str:
    for prefix in _RATE_LIMITS:
        if path.startswith(prefix):
            return prefix
    return "default"
