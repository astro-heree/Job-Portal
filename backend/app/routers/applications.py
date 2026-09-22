import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_role
from app.db.session import get_db
from app.models.enums import ApplicationStatus, UserRole
from app.models.user import User
from app.schemas.application import (
    ApplicationOut,
    ApplicationStatusUpdateRequest,
    BulkStatusUpdateRequest,
    CandidateApplicationOut,
)
from app.schemas.pagination import PageParams, PaginatedResponse
from app.services import application_service

router = APIRouter(prefix="/applications", tags=["applications"])


@router.get("/me", response_model=PaginatedResponse[CandidateApplicationOut])
def list_my_applications(
    status: ApplicationStatus | None = None,
    job_id: uuid.UUID | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    candidate_user: User = Depends(require_role(UserRole.CANDIDATE)),
    db: Session = Depends(get_db),
) -> PaginatedResponse[CandidateApplicationOut]:
    page_params = PageParams(page=page, page_size=page_size)
    items, total = application_service.list_my_applications(
        db, candidate_user, status=status, job_id=job_id, page_params=page_params
    )
    return PaginatedResponse.build(
        [application_service.to_candidate_application_out(a) for a in items], total, page_params
    )


@router.patch("/bulk-status", response_model=list[ApplicationOut])
def bulk_update_status(
    payload: BulkStatusUpdateRequest,
    hr_user: User = Depends(require_role(UserRole.HR)),
    db: Session = Depends(get_db),
) -> list[ApplicationOut]:
    applications = application_service.bulk_update_status(
        db, hr_user, payload.application_ids, payload.status
    )
    return [ApplicationOut.model_validate(a) for a in applications]


@router.get("/{application_id}", response_model=ApplicationOut)
def get_application(
    application_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ApplicationOut:
    application = application_service.get_application(db, application_id, current_user)
    return ApplicationOut.model_validate(application)


@router.patch("/{application_id}/status", response_model=ApplicationOut)
def update_application_status(
    application_id: uuid.UUID,
    payload: ApplicationStatusUpdateRequest,
    hr_user: User = Depends(require_role(UserRole.HR)),
    db: Session = Depends(get_db),
) -> ApplicationOut:
    application = application_service.update_application_status(
        db, application_id, hr_user, payload.status
    )
    return ApplicationOut.model_validate(application)
