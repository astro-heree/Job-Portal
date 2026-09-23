import uuid

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import ForbiddenError, NotFoundError
from app.core.storage import delete_resume, resume_path, save_resume, validate_resume_upload
from app.models.candidate_profile import CandidateProfile
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.candidate import CandidateProfileOut, CandidateProfileUpdateRequest


def _to_out(user: User) -> CandidateProfileOut:
    profile = user.candidate_profile
    return CandidateProfileOut(
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=profile.phone if profile else None,
        headline=profile.headline if profile else None,
        experience_years=profile.experience_years if profile else None,
        skills=profile.skills if profile else [],
        location=profile.location if profile else None,
        expected_salary=profile.expected_salary if profile else None,
        has_resume=bool(profile and profile.resume_filename),
    )


def get_own_profile(candidate_user: User) -> CandidateProfileOut:
    return _to_out(candidate_user)


def update_own_profile(
    db: Session, candidate_user: User, payload: CandidateProfileUpdateRequest
) -> CandidateProfileOut:
    profile = candidate_user.candidate_profile
    if profile is None:
        profile = CandidateProfile(user_id=candidate_user.id)
        db.add(profile)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(candidate_user)
    return _to_out(candidate_user)


def upload_resume(db: Session, candidate_user: User, *, content_type: str | None, content: bytes) -> CandidateProfileOut:
    validate_resume_upload(content_type=content_type, content=content)

    profile = candidate_user.candidate_profile
    if profile is None:
        profile = CandidateProfile(user_id=candidate_user.id)
        db.add(profile)

    filename = save_resume(candidate_user.id, content)
    profile.resume_filename = filename
    db.commit()
    db.refresh(candidate_user)
    return _to_out(candidate_user)


def get_own_resume_path(candidate_user: User):
    profile = candidate_user.candidate_profile
    if profile is None or not profile.resume_filename:
        raise NotFoundError("No resume on file")
    return resume_path(candidate_user.id)


def get_candidate_resume_path(db: Session, candidate_id: uuid.UUID, current_user: User):
    if current_user.role != UserRole.HR and current_user.id != candidate_id:
        raise ForbiddenError("You do not have access to this resume")

    candidate = db.get(User, candidate_id)
    if candidate is None or candidate.role != UserRole.CANDIDATE:
        raise NotFoundError("Candidate not found")

    profile = candidate.candidate_profile
    if profile is None or not profile.resume_filename:
        raise NotFoundError("No resume on file")
    return resume_path(candidate_id)


def remove_own_resume(db: Session, candidate_user: User) -> None:
    profile = candidate_user.candidate_profile
    if profile is not None and profile.resume_filename:
        delete_resume(candidate_user.id)
        profile.resume_filename = None
        db.commit()


def get_candidate_detail(db: Session, candidate_id: uuid.UUID) -> CandidateProfileOut:
    candidate = (
        db.query(User)
        .options(joinedload(User.candidate_profile))
        .filter(User.id == candidate_id, User.role == UserRole.CANDIDATE)
        .first()
    )
    if candidate is None:
        raise NotFoundError("Candidate not found")
    return _to_out(candidate)


def search_candidates(
    db: Session,
    *,
    q: str | None,
    skills: list[str] | None,
    location: str | None,
    min_experience_years: float | None,
    max_salary: int | None,
    page: int,
    page_size: int,
) -> tuple[list[CandidateProfileOut], int]:
    query = (
        db.query(User)
        .join(CandidateProfile, CandidateProfile.user_id == User.id)
        .options(joinedload(User.candidate_profile))
        .filter(User.role == UserRole.CANDIDATE)
    )

    if q:
        like = f"%{q}%"
        query = query.filter(
            (User.full_name.ilike(like)) | (CandidateProfile.headline.ilike(like))
        )
    if skills:
        # `.any(skill)` would require an exact, case-sensitive match against
        # one array element (so "script" would never match "TypeScript").
        # Flattening to a delimited string and using ILIKE gives a
        # case-insensitive "includes" match instead, across any skill.
        skills_as_text = func.array_to_string(CandidateProfile.skills, ",")
        for skill in skills:
            query = query.filter(skills_as_text.ilike(f"%{skill}%"))
    if location:
        query = query.filter(CandidateProfile.location.ilike(f"%{location}%"))
    if min_experience_years is not None:
        query = query.filter(CandidateProfile.experience_years >= min_experience_years)
    if max_salary is not None:
        # A candidate's *expected* salary is a ceiling on what they'd cost --
        # HR wants candidates within budget, i.e. expected_salary <= max,
        # not a floor.
        query = query.filter(CandidateProfile.expected_salary <= max_salary)

    total = query.count()
    users = query.order_by(User.full_name).offset((page - 1) * page_size).limit(page_size).all()
    return [_to_out(u) for u in users], total
