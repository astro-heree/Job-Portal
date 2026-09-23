"""Lightweight test-data builders. Plain functions returning committed ORM
objects -- no factory_boy/faker dependency needed at this scale."""

import itertools

from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.application import Application
from app.models.candidate_profile import CandidateProfile
from app.models.enums import ApplicationStatus, EmploymentType, UserRole
from app.models.hr_profile import HRProfile
from app.models.job import Job
from app.models.message import Message
from app.models.user import User

_email_counter = itertools.count(1)


def _unique_email(prefix: str) -> str:
    return f"{prefix}{next(_email_counter)}@jobportal.dev"


def create_hr(db: Session, *, company_name: str = "Acme Corp", **overrides) -> User:
    email = overrides.pop("email", None) or _unique_email("hr")
    full_name = overrides.pop("full_name", "HR Tester")
    user = User(
        email=email,
        password_hash=hash_password("Password123!"),
        full_name=full_name,
        role=UserRole.HR,
        is_active=overrides.pop("is_active", True),
    )
    db.add(user)
    db.flush()
    db.add(HRProfile(user_id=user.id, company_name=company_name, **overrides))
    db.commit()
    db.refresh(user)
    return user


def create_candidate(db: Session, **overrides) -> User:
    email = overrides.pop("email", None) or _unique_email("candidate")
    full_name = overrides.pop("full_name", "Candidate Tester")
    profile_fields = {
        "skills": overrides.pop("skills", []),
        "experience_years": overrides.pop("experience_years", None),
        "location": overrides.pop("location", None),
        "headline": overrides.pop("headline", None),
        "phone": overrides.pop("phone", None),
        "resume_filename": overrides.pop("resume_filename", None),
        "expected_salary": overrides.pop("expected_salary", None),
    }
    user = User(
        email=email,
        password_hash=hash_password("Password123!"),
        full_name=full_name,
        role=UserRole.CANDIDATE,
        is_active=overrides.pop("is_active", True),
    )
    db.add(user)
    db.flush()
    db.add(CandidateProfile(user_id=user.id, **profile_fields))
    db.commit()
    db.refresh(user)
    return user


def create_job(db: Session, hr_user: User, **overrides) -> Job:
    job = Job(
        hr_id=hr_user.id,
        title=overrides.pop("title", "Backend Engineer"),
        description=overrides.pop("description", "Build and ship things."),
        skills=overrides.pop("skills", ["Python"]),
        location=overrides.pop("location", "Remote"),
        employment_type=overrides.pop("employment_type", EmploymentType.FULL_TIME),
        min_experience_years=overrides.pop("min_experience_years", None),
        max_experience_years=overrides.pop("max_experience_years", None),
        salary_min=overrides.pop("salary_min", None),
        salary_max=overrides.pop("salary_max", None),
        is_active=overrides.pop("is_active", True),
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def create_application(db: Session, job: Job, candidate: User, **overrides) -> Application:
    application = Application(
        job_id=job.id,
        candidate_id=candidate.id,
        status=overrides.pop("status", ApplicationStatus.APPLIED),
        cover_note=overrides.pop("cover_note", None),
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


def create_message(db: Session, sender: User, recipient: User, **overrides) -> Message:
    message = Message(
        sender_hr_id=sender.id,
        recipient_candidate_id=recipient.id,
        subject=overrides.pop("subject", "Interview invitation"),
        body=overrides.pop("body", "Are you available this week?"),
        read_at=overrides.pop("read_at", None),
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message
