import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import EmploymentType


class JobBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1)
    skills: list[str] = Field(default_factory=list)
    location: str = Field(min_length=1, max_length=255)
    employment_type: EmploymentType
    min_experience_years: float | None = Field(default=None, ge=0, le=60)
    max_experience_years: float | None = Field(default=None, ge=0, le=60)
    salary_min: int | None = Field(default=None, ge=0)
    salary_max: int | None = Field(default=None, ge=0)

    @model_validator(mode="after")
    def validate_ranges(self) -> "JobBase":
        if (
            self.min_experience_years is not None
            and self.max_experience_years is not None
            and self.max_experience_years < self.min_experience_years
        ):
            raise ValueError("max_experience_years must be greater than or equal to min_experience_years")
        if self.salary_min is not None and self.salary_max is not None and self.salary_max < self.salary_min:
            raise ValueError("salary_max must be greater than or equal to salary_min")
        return self

    @model_validator(mode="after")
    def dedupe_skills(self) -> "JobBase":
        seen: dict[str, None] = {}
        for skill in self.skills:
            cleaned = skill.strip()
            if cleaned:
                seen.setdefault(cleaned, None)
        self.skills = list(seen.keys())
        return self


class JobCreateRequest(JobBase):
    pass


class JobUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, min_length=1)
    skills: list[str] | None = None
    location: str | None = Field(default=None, min_length=1, max_length=255)
    employment_type: EmploymentType | None = None
    min_experience_years: float | None = Field(default=None, ge=0, le=60)
    max_experience_years: float | None = Field(default=None, ge=0, le=60)
    salary_min: int | None = Field(default=None, ge=0)
    salary_max: int | None = Field(default=None, ge=0)

    @model_validator(mode="after")
    def validate_ranges(self) -> "JobUpdateRequest":
        if (
            self.min_experience_years is not None
            and self.max_experience_years is not None
            and self.max_experience_years < self.min_experience_years
        ):
            raise ValueError("max_experience_years must be greater than or equal to min_experience_years")
        if self.salary_min is not None and self.salary_max is not None and self.salary_max < self.salary_min:
            raise ValueError("salary_max must be greater than or equal to salary_min")
        return self


class JobStatusUpdateRequest(BaseModel):
    is_active: bool


class JobOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    hr_id: uuid.UUID
    company_name: str | None
    title: str
    description: str
    skills: list[str]
    location: str
    employment_type: EmploymentType
    min_experience_years: float | None
    max_experience_years: float | None
    salary_min: int | None
    salary_max: int | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class JobApplyRequest(BaseModel):
    cover_note: str | None = Field(default=None, max_length=4000)
