import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_user_optional, require_role
from app.db.session import get_db
from app.models.enums import ApplicationStatus, EmploymentType, UserRole
from app.models.user import User
from app.schemas.application import ApplicantOut, ApplicationOut
from app.schemas.job import (
    JobApplyRequest,
    JobCreateRequest,
    JobOut,
    JobStatusUpdateRequest,
    JobUpdateRequest,
)
from app.schemas.pagination import PageParams, PaginatedResponse
from app.services import job_service

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post("", response_model=JobOut, status_code=201)
def create_job(
    payload: JobCreateRequest,
    hr_user: User = Depends(require_role(UserRole.HR)),
    db: Session = Depends(get_db),
) -> JobOut:
    job = job_service.create_job(db, hr_user, payload)
    return JobOut.model_validate(job)


@router.get("", response_model=PaginatedResponse[JobOut])
def search_jobs(
    q: str | None = None,
    skills: list[str] | None = Query(default=None),
    location: str | None = None,
    employment_type: EmploymentType | None = None,
    experience_years: float | None = Query(default=None, ge=0, le=60),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> PaginatedResponse[JobOut]:
    page_params = PageParams(page=page, page_size=page_size)
    items, total = job_service.list_jobs(
        db,
        q=q,
        skills=skills,
        location=location,
        employment_type=employment_type,
        experience_years=experience_years,
        page_params=page_params,
    )
    return PaginatedResponse.build([JobOut.model_validate(j) for j in items], total, page_params)


@router.get("/{job_id}", response_model=JobOut)
def get_job(
    job_id: uuid.UUID,
    current_user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> JobOut:
    job = job_service.get_job_for_view(db, job_id, current_user)
    return JobOut.model_validate(job)


@router.patch("/{job_id}", response_model=JobOut)
def update_job(
    job_id: uuid.UUID,
    payload: JobUpdateRequest,
    hr_user: User = Depends(require_role(UserRole.HR)),
    db: Session = Depends(get_db),
) -> JobOut:
    job = job_service.update_job(db, job_id, hr_user, payload)
    return JobOut.model_validate(job)


@router.patch("/{job_id}/status", response_model=JobOut)
def set_job_status(
    job_id: uuid.UUID,
    payload: JobStatusUpdateRequest,
    hr_user: User = Depends(require_role(UserRole.HR)),
    db: Session = Depends(get_db),
) -> JobOut:
    job = job_service.set_job_status(db, job_id, hr_user, payload.is_active)
    return JobOut.model_validate(job)


@router.post("/{job_id}/apply", response_model=ApplicationOut, status_code=201)
def apply_to_job(
    job_id: uuid.UUID,
    payload: JobApplyRequest,
    candidate_user: User = Depends(require_role(UserRole.CANDIDATE)),
    db: Session = Depends(get_db),
) -> ApplicationOut:
    application = job_service.apply_to_job(db, job_id, candidate_user, payload.cover_note)
    return ApplicationOut.model_validate(application)


@router.get("/{job_id}/applications", response_model=PaginatedResponse[ApplicantOut])
def list_job_applicants(
    job_id: uuid.UUID,
    status: ApplicationStatus | None = None,
    q: str | None = None,
    min_ats_rating: int | None = Query(default=None, ge=1, le=5),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    hr_user: User = Depends(require_role(UserRole.HR)),
    db: Session = Depends(get_db),
) -> PaginatedResponse[ApplicantOut]:
    page_params = PageParams(page=page, page_size=page_size)
    items, total = job_service.list_job_applicants(
        db,
        job_id,
        hr_user,
        status=status,
        q=q,
        min_ats_rating=min_ats_rating,
        page_params=page_params,
    )
    return PaginatedResponse.build(
        [job_service.to_applicant_out(a) for a in items], total, page_params
    )
