from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import require_role
from app.db.session import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.dashboard import HRDashboardStatsOut
from app.schemas.hr import HRProfileOut, HRProfileUpdateRequest
from app.schemas.job import JobOut
from app.schemas.pagination import PaginatedResponse, PageParams
from app.services import dashboard_service, hr_service

router = APIRouter(prefix="/hr", tags=["hr"])


@router.get("/me", response_model=HRProfileOut)
def get_my_profile(hr_user: User = Depends(require_role(UserRole.HR))) -> HRProfileOut:
    return hr_service.get_own_profile(hr_user)


@router.patch("/me", response_model=HRProfileOut)
def update_my_profile(
    payload: HRProfileUpdateRequest,
    hr_user: User = Depends(require_role(UserRole.HR)),
    db: Session = Depends(get_db),
) -> HRProfileOut:
    return hr_service.update_own_profile(db, hr_user, payload)


@router.get("/jobs", response_model=PaginatedResponse[JobOut])
def list_my_jobs(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    hr_user: User = Depends(require_role(UserRole.HR)),
    db: Session = Depends(get_db),
) -> PaginatedResponse[JobOut]:
    page_params = PageParams(page=page, page_size=page_size)
    items, total = hr_service.list_own_jobs(db, hr_user, page_params)
    return PaginatedResponse.build([JobOut.model_validate(j) for j in items], total, page_params)


@router.get("/dashboard/stats", response_model=HRDashboardStatsOut)
def get_dashboard_stats(
    hr_user: User = Depends(require_role(UserRole.HR)),
    db: Session = Depends(get_db),
) -> HRDashboardStatsOut:
    return dashboard_service.get_hr_dashboard_stats(db, hr_user)
