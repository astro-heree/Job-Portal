from sqlalchemy.orm import Session, joinedload

from app.models.hr_profile import HRProfile
from app.models.job import Job
from app.models.user import User
from app.schemas.hr import HRProfileOut, HRProfileUpdateRequest
from app.schemas.pagination import PageParams


def _to_out(user: User) -> HRProfileOut:
    profile = user.hr_profile
    return HRProfileOut(
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        company_name=profile.company_name if profile else "",
        designation=profile.designation if profile else None,
    )


def get_own_profile(hr_user: User) -> HRProfileOut:
    return _to_out(hr_user)


def update_own_profile(db: Session, hr_user: User, payload: HRProfileUpdateRequest) -> HRProfileOut:
    profile = hr_user.hr_profile
    if profile is None:
        profile = HRProfile(user_id=hr_user.id, company_name=payload.company_name or "")
        db.add(profile)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(hr_user)
    return _to_out(hr_user)


def list_own_jobs(db: Session, hr_user: User, page_params: PageParams) -> tuple[list[Job], int]:
    query = (
        db.query(Job)
        .options(joinedload(Job.hr).joinedload(User.hr_profile))
        .filter(Job.hr_id == hr_user.id)
        .order_by(Job.created_at.desc())
    )
    total = query.count()
    items = query.offset(page_params.offset).limit(page_params.page_size).all()
    return items, total
