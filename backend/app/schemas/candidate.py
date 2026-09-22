import uuid

from pydantic import BaseModel, Field, model_validator


class CandidateProfileOut(BaseModel):
    user_id: uuid.UUID
    email: str
    full_name: str
    phone: str | None
    headline: str | None
    experience_years: float | None
    skills: list[str]
    location: str | None
    has_resume: bool

    model_config = {"from_attributes": False}


class CandidateProfileUpdateRequest(BaseModel):
    phone: str | None = Field(default=None, max_length=30)
    headline: str | None = Field(default=None, max_length=255)
    experience_years: float | None = Field(default=None, ge=0, le=60)
    skills: list[str] | None = None
    location: str | None = Field(default=None, max_length=255)

    @model_validator(mode="after")
    def dedupe_skills(self) -> "CandidateProfileUpdateRequest":
        if self.skills is not None:
            seen: dict[str, None] = {}
            for skill in self.skills:
                cleaned = skill.strip()
                if cleaned:
                    seen.setdefault(cleaned, None)
            self.skills = list(seen.keys())
        return self


class CandidateStatsOut(BaseModel):
    total_applications: int
    applied_count: int
    shortlisted_count: int
    rejected_count: int
    unread_messages: int
