import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import ApplicationStatus


class ApplicationOut(BaseModel):
    id: uuid.UUID
    job_id: uuid.UUID
    candidate_id: uuid.UUID
    status: ApplicationStatus
    cover_note: str | None
    applied_at: datetime
    updated_at: datetime
    ats_score: int
    ats_rating: int

    model_config = {"from_attributes": True}


class ApplicantOut(ApplicationOut):
    """An application as seen by the owning HR user -- includes enough of the
    candidate's profile to screen them without a second request per row."""

    candidate_full_name: str
    candidate_email: str
    candidate_headline: str | None
    candidate_skills: list[str]
    candidate_experience_years: float | None
    candidate_location: str | None
    has_resume: bool


class CandidateApplicationOut(ApplicationOut):
    """An application as seen by the candidate who submitted it -- includes
    enough of the job/company to render "my applications" without a join."""

    job_title: str
    company_name: str | None
    job_location: str
    job_is_active: bool


class ApplicationStatusUpdateRequest(BaseModel):
    status: ApplicationStatus


class BulkStatusUpdateRequest(BaseModel):
    application_ids: list[uuid.UUID] = Field(min_length=1)
    status: ApplicationStatus
