import uuid

from pydantic import BaseModel, Field


class HRProfileOut(BaseModel):
    user_id: uuid.UUID
    email: str
    full_name: str
    company_name: str
    designation: str | None

    model_config = {"from_attributes": False}


class HRProfileUpdateRequest(BaseModel):
    company_name: str | None = Field(default=None, min_length=1, max_length=255)
    designation: str | None = Field(default=None, max_length=255)
