import uuid

from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.models.application import Application
from app.models.enums import ApplicationStatus, EmploymentType
from app.models.job import Job
from app.models.user import User
from app.schemas.application import ApplicantOut
from app.schemas.job import JobCreateRequest, JobUpdateRequest
from app.schemas.pagination import PageParams


def to_applicant_out(application: Application) -> ApplicantOut:
    candidate = application.candidate
    profile = candidate.candidate_profile if candidate else None
    return ApplicantOut(
        id=application.id,
        job_id=application.job_id,
        candidate_id=application.candidate_id,
        status=application.status,
        cover_note=application.cover_note,
        applied_at=application.applied_at,
        updated_at=application.updated_at,
        ats_score=application.ats_score,
        ats_rating=application.ats_rating,
        candidate_full_name=candidate.full_name if candidate else "",
        candidate_email=candidate.email if candidate else "",
        candidate_headline=profile.headline if profile else None,
        candidate_skills=profile.skills if profile else [],
        candidate_experience_years=profile.experience_years if profile else None,
        candidate_location=profile.location if profile else None,
        has_resume=bool(profile and profile.resume_filename),
    )


def create_job(db: Session, hr_user: User, payload: JobCreateRequest) -> Job:
    job = Job(hr_id=hr_user.id, **payload.model_dump())
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def get_owned_job(db: Session, job_id: uuid.UUID, hr_user: User) -> Job:
    """Fetch a job the given HR user owns, or raise.

    This is checked independently of the require_role(HR) gate on the
    route: role alone only proves "this is an HR user", not "this HR user
    owns this job". Without this check HR #2 could edit HR #1's jobs by
    guessing a job id.
    """
    job = db.get(Job, job_id)
    if job is None:
        raise NotFoundError("Job not found")
    if job.hr_id != hr_user.id:
        raise ForbiddenError("You do not have access to this job")
    return job


def get_job_for_view(db: Session, job_id: uuid.UUID, current_user: User | None) -> Job:
    job = (
        db.query(Job)
        .options(joinedload(Job.hr).joinedload(User.hr_profile))
        .filter(Job.id == job_id)
        .first()
    )
    if job is None:
        raise NotFoundError("Job not found")
    if not job.is_active and (current_user is None or current_user.id != job.hr_id):
        raise NotFoundError("Job not found")
    return job


def list_jobs(
    db: Session,
    *,
    q: str | None,
    skills: list[str] | None,
    location: str | None,
    employment_type: EmploymentType | None,
    experience_years: float | None,
    page_params: PageParams,
) -> tuple[list[Job], int]:
    query = (
        db.query(Job)
        .options(joinedload(Job.hr).joinedload(User.hr_profile))
        .filter(Job.is_active.is_(True))
    )

    if q:
        like = f"%{q}%"
        query = query.filter(or_(Job.title.ilike(like), Job.description.ilike(like)))
    if skills:
        for skill in skills:
            query = query.filter(Job.skills.any(skill))
    if location:
        query = query.filter(Job.location.ilike(f"%{location}%"))
    if employment_type:
        query = query.filter(Job.employment_type == employment_type)
    if experience_years is not None:
        query = query.filter(
            or_(Job.min_experience_years.is_(None), Job.min_experience_years <= experience_years),
            or_(Job.max_experience_years.is_(None), Job.max_experience_years >= experience_years),
        )

    total = query.count()
    items = (
        query.order_by(Job.created_at.desc())
        .offset(page_params.offset)
        .limit(page_params.page_size)
        .all()
    )
    return items, total


def update_job(db: Session, job_id: uuid.UUID, hr_user: User, payload: JobUpdateRequest) -> Job:
    job = get_owned_job(db, job_id, hr_user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(job, field, value)
    db.commit()
    db.refresh(job)
    return job


def set_job_status(db: Session, job_id: uuid.UUID, hr_user: User, is_active: bool) -> Job:
    job = get_owned_job(db, job_id, hr_user)
    job.is_active = is_active
    db.commit()
    db.refresh(job)
    return job


def apply_to_job(db: Session, job_id: uuid.UUID, candidate_user: User, cover_note: str | None) -> Application:
    job = db.get(Job, job_id)
    if job is None or not job.is_active:
        raise NotFoundError("Job not found")

    existing = (
        db.query(Application)
        .filter(Application.job_id == job_id, Application.candidate_id == candidate_user.id)
        .first()
    )
    if existing is not None:
        raise ConflictError("You have already applied to this job")

    application = Application(job_id=job_id, candidate_id=candidate_user.id, cover_note=cover_note)
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


def list_job_applicants(
    db: Session,
    job_id: uuid.UUID,
    hr_user: User,
    *,
    status: ApplicationStatus | None,
    q: str | None,
    min_ats_rating: int | None,
    page_params: PageParams,
) -> tuple[list[Application], int]:
    get_owned_job(db, job_id, hr_user)  # 403/404 ownership check, result unused beyond that

    query = (
        db.query(Application)
        .options(joinedload(Application.candidate).joinedload(User.candidate_profile))
        .filter(Application.job_id == job_id)
    )
    if status:
        query = query.filter(Application.status == status)
    if q:
        like = f"%{q}%"
        query = query.join(User, Application.candidate_id == User.id).filter(
            or_(User.full_name.ilike(like), User.email.ilike(like))
        )

    applications = query.all()

    # ATS rating is a computed Python property (not a DB column), so the
    # rating filter and the default ATS-descending sort happen in Python.
    # Acceptable at the scale of applicants-per-job; would not scale to a
    # global, unbounded applicant table.
    if min_ats_rating is not None:
        applications = [a for a in applications if a.ats_rating >= min_ats_rating]

    applications.sort(key=lambda a: a.ats_rating, reverse=True)

    total = len(applications)
    start = page_params.offset
    end = start + page_params.page_size
    return applications[start:end], total
