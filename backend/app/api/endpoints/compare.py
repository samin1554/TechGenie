from fastapi import APIRouter, Depends, HTTPException

from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.compare import CompareRequest, CompareResponse
from app.services.compare_service import CompareService
from app.services.github_service import GitHubRateLimitError, GitHubUserNotFoundError

router = APIRouter()


@router.post("", response_model=CompareResponse)
async def compare_profiles(
    body: CompareRequest,
    user: User = Depends(get_current_user),
):
    """Compare two GitHub profiles side-by-side. Free — no credit cost."""
    if body.username_a.strip().lower() == body.username_b.strip().lower():
        raise HTTPException(status_code=400, detail="Cannot compare a user with themselves")

    try:
        result = await CompareService.compare(body.username_a, body.username_b)
    except GitHubUserNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except GitHubRateLimitError:
        raise HTTPException(status_code=429, detail="GitHub API rate limit exceeded")

    return result
