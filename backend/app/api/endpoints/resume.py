import io
from uuid import UUID

import fitz  # PyMuPDF
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.analysis import NoCreditsResponse
from app.schemas.ats_score import ATSScoreRequest, ATSScoreResponse
from app.schemas.resume import (
    GenerateResumeRequest,
    ParseResumeResponse,
    ResumeListItem,
    ResumeResponse,
    ResumeUpdateRequest,
)
from app.services.groq_service import GroqService
from app.services.resume_service import ResumeService

router = APIRouter()


@router.post("/parse", response_model=ParseResumeResponse)
async def parse_resume_pdf(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    """Extract text from an uploaded PDF resume."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:  # 10MB
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    try:
        doc = fitz.open(stream=content, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
    except Exception:
        raise HTTPException(status_code=400, detail="Could not parse PDF file")

    if not text.strip():
        raise HTTPException(status_code=400, detail="No text found in PDF. Is it a scanned image?")

    return ParseResumeResponse(text=text.strip())


@router.post("/score", response_model=ATSScoreResponse)
async def score_resume(
    body: ATSScoreRequest,
    user: User = Depends(get_current_user),
):
    """Score a resume across 5 ATS categories. Free — no credit cost."""
    result = await GroqService.score_resume_ats(
        resume_text=body.resume_text,
        role=body.role,
    )
    if not result:
        raise HTTPException(status_code=500, detail="Failed to score resume. Please try again.")

    return ATSScoreResponse(**result)


@router.post(
    "/generate",
    response_model=ResumeResponse,
    responses={402: {"model": NoCreditsResponse}},
)
async def generate_resume(
    body: GenerateResumeRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not user.is_premium and user.credits_remaining <= 0:
        raise HTTPException(
            status_code=402,
            detail={
                "error": "no_credits",
                "message": "You've used all your free credits.",
                "upgrade_url": "/pricing",
            },
        )

    result = await ResumeService.generate(
        db=db,
        user=user,
        resume_text=body.resume_text,
        template=body.template,
        role=body.role,
        job_description=body.job_description,
        tone=body.tone,
        github_username=body.github_username,
    )
    return result


@router.get("/list", response_model=list[ResumeListItem])
async def list_resumes(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ResumeService.list_user_resumes(db, user.id)


@router.get("/{resume_id}", response_model=ResumeResponse)
async def get_resume(
    resume_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await ResumeService.get_by_id(db, user, resume_id)
    if not result:
        raise HTTPException(status_code=404, detail="Resume not found")
    return result


@router.patch("/{resume_id}", response_model=ResumeResponse)
async def update_resume(
    resume_id: UUID,
    body: ResumeUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await ResumeService.update(db, user, resume_id, body)
    if not result:
        raise HTTPException(status_code=404, detail="Resume not found")
    return result


@router.delete("/{resume_id}")
async def delete_resume(
    resume_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    deleted = await ResumeService.delete(db, user, resume_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Resume not found")
    return {"message": "Deleted"}
