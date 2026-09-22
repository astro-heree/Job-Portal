import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class MessageBulkCreateRequest(BaseModel):
    recipient_candidate_ids: list[uuid.UUID] = Field(min_length=1)
    subject: str = Field(min_length=1, max_length=255)
    body: str = Field(min_length=1, max_length=4000)


class MessageOut(BaseModel):
    id: uuid.UUID
    sender_hr_id: uuid.UUID
    sender_company_name: str | None
    subject: str
    body: str
    sent_at: datetime
    read_at: datetime | None

    model_config = {"from_attributes": False}
