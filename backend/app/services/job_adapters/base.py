from abc import ABC, abstractmethod

from app.schemas.jobs import Job


class JobAdapter(ABC):
    """Base class for job search adapters."""

    name: str = "base"
    cache_ttl: int = 3600

    @abstractmethod
    async def search(
        self,
        query: str,
        location: str | None = None,
        employment_type: str | None = None,
        remote_only: bool = False,
    ) -> list[Job]:
        ...

    def is_available(self) -> bool:
        """Return True if this adapter has the required config to work."""
        return True
