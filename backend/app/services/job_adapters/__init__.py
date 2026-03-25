from app.services.job_adapters.base import JobAdapter
from app.services.job_adapters.remotive import RemotiveAdapter
from app.services.job_adapters.adzuna import AdzunaAdapter
from app.services.job_adapters.hn_hiring import HNHiringAdapter
from app.services.job_adapters.jsearch import JSearchAdapter

__all__ = [
    "JobAdapter",
    "RemotiveAdapter",
    "AdzunaAdapter",
    "HNHiringAdapter",
    "JSearchAdapter",
]
