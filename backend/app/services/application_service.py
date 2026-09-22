import uuid

from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.application import Application
from app.models.enums import ApplicationStatus
from app.models.job import Job
from app.models.user import User
from app.schemas.application import CandidateApplicationOut
from app.schemas.pagination import PageParams


def to_candidate_application_out(application: Application) -> CandidateApplicationOut:
    job = application.job
    return CandidateApplicationOut(
        id=application.id,
        job_id=application.job_id,
        candidate_id=application.candidate_id,
        status=application.status,
        cover_note=application.cover_note,
        applied_at=application.applied_at,
        updated_at=application.updated_at,
        ats_score=application.ats_score,
        ats_rating=application.ats_rating,
        job_title=job.title if job else "",
        company_name=job.company_name if job else None,
        job_location=job.location if job else "",
        job_is_active=job.is_active if job else False,
    )


def _application_query(db: Session):
    return db.query(Application).options(
        joinedload(Application.job).joinedload(Job.hr).joinedload(User.hr_profile),
        joinedload(Application.candidate).joinedload(User.candidate_profile),
    )


def list_my_applications(
    db: Session,
    candidate_user: User,
    *,
    status: ApplicationStatus | None,
    job_id: uuid.UUID | None,
    page_params: PageParams,
) -> tuple[list[Application], int]:
    query = _application_query(db).filter(Application.candidate_id == candidate_user.id)
    if status:
        query = query.filter(Application.status == status)
    if job_id:
        query = query.filter(Application.job_id == job_id)

    total = query.count()
    items = (
        query.order_by(Application.applied_at.desc())
        .offset(page_params.offset)
        .limit(page_params.page_size)
        .all()
    )
    return items, total


def get_application(db: Session, application_id: uuid.UUID, current_user: User) -> Application:
    application = _application_query(db).filter(Application.id == application_id).first()
    if application is None:
        raise NotFoundError("Application not found")

    is_owning_candidate = application.candidate_id == current_user.id
    is_owning_hr = application.job is not None and application.job.hr_id == current_user.id
    if not (is_owning_candidate or is_owning_hr):
        raise ForbiddenError("You do not have access to this application")

    return application


def update_application_status(
    db: Session, application_id: uuid.UUID, hr_user: User, status: ApplicationStatus
) -> Application:
    application = _application_query(db).filter(Application.id == application_id).first()
    if application is None:
        raise NotFoundError("Application not found")
    if application.job is None or application.job.hr_id != hr_user.id:
        raise ForbiddenError("You do not have access to this application")

    application.status = status
    db.commit()
    db.refresh(application)
    return application


def bulk_update_status(
    db: Session, hr_user: User, application_ids: list[uuid.UUID], status: ApplicationStatus
) -> list[Application]:
    # Scoped to jobs the requesting HR owns -- any id for a job owned by a
    # different HR is silently excluded rather than failing the whole
    # batch, which keeps a mixed-ownership request from being usable as a
    # 403/404 oracle for guessing other HRs' application ids.
    applications = (
        _application_query(db)
        .join(Job, Application.job_id == Job.id)
        .filter(Application.id.in_(application_ids), Job.hr_id == hr_user.id)
        .all()
    )
    for application in applications:
        application.status = status
    db.commit()
    for application in applications:
        db.refresh(application)
    return applications
