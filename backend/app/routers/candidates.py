import uuid

from fastapi import APIRouter, Depends, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_role
from app.db.session import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.candidate import CandidateProfileOut, CandidateProfileUpdateRequest, CandidateStatsOut
from app.schemas.pagination import PaginatedResponse, PageParams
from app.services import candidate_service, dashboard_service

router = APIRouter(prefix="/candidates", tags=["candidates"])


@router.get("/me", response_model=CandidateProfileOut)
def get_my_profile(candidate_user: User = Depends(require_role(UserRole.CANDIDATE))) -> CandidateProfileOut:
    return candidate_service.get_own_profile(candidate_user)


@router.patch("/me", response_model=CandidateProfileOut)
def update_my_profile(
    payload: CandidateProfileUpdateRequest,
    candidate_user: User = Depends(require_role(UserRole.CANDIDATE)),
    db: Session = Depends(get_db),
) -> CandidateProfileOut:
    return candidate_service.update_own_profile(db, candidate_user, payload)


@router.get("/me/stats", response_model=CandidateStatsOut)
def get_my_stats(
    candidate_user: User = Depends(require_role(UserRole.CANDIDATE)),
    db: Session = Depends(get_db),
) -> CandidateStatsOut:
    return dashboard_service.get_candidate_stats(db, candidate_user)


@router.post("/me/resume", response_model=CandidateProfileOut, status_code=201)
async def upload_my_resume(
    file: UploadFile,
    candidate_user: User = Depends(require_role(UserRole.CANDIDATE)),
    db: Session = Depends(get_db),
) -> CandidateProfileOut:
    content = await file.read()
    return candidate_service.upload_resume(
        db, candidate_user, content_type=file.content_type, content=content
    )


@router.get("/me/resume")
def download_my_resume(
    candidate_user: User = Depends(require_role(UserRole.CANDIDATE)),
) -> FileResponse:
    path = candidate_service.get_own_resume_path(candidate_user)
    return FileResponse(path, media_type="application/pdf", filename="resume.pdf")


@router.get("", response_model=PaginatedResponse[CandidateProfileOut])
def search_candidates(
    q: str | None = None,
    skills: list[str] | None = Query(default=None),
    location: str | None = None,
    min_experience_years: float | None = Query(default=None, ge=0, le=60),
    min_salary: int | None = Query(default=None, ge=0),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    _hr_user: User = Depends(require_role(UserRole.HR)),
    db: Session = Depends(get_db),
) -> PaginatedResponse[CandidateProfileOut]:
    page_params = PageParams(page=page, page_size=page_size)
    items, total = candidate_service.search_candidates(
        db,
        q=q,
        skills=skills,
        location=location,
        min_experience_years=min_experience_years,
        min_salary=min_salary,
        page=page_params.page,
        page_size=page_params.page_size,
    )
    return PaginatedResponse.build(items, total, page_params)


@router.get("/{candidate_id}", response_model=CandidateProfileOut)
def get_candidate(
    candidate_id: uuid.UUID,
    _hr_user: User = Depends(require_role(UserRole.HR)),
    db: Session = Depends(get_db),
) -> CandidateProfileOut:
    return candidate_service.get_candidate_detail(db, candidate_id)


@router.get("/{candidate_id}/resume")
def download_candidate_resume(
    candidate_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FileResponse:
    path = candidate_service.get_candidate_resume_path(db, candidate_id, current_user)
    return FileResponse(path, media_type="application/pdf", filename="resume.pdf")
