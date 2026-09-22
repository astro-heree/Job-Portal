import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import require_role
from app.db.session import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.message import MessageBulkCreateRequest, MessageOut
from app.schemas.pagination import PaginatedResponse, PageParams
from app.services import message_service

router = APIRouter(prefix="/messages", tags=["messages"])


@router.post("/bulk", response_model=list[MessageOut], status_code=201)
def send_bulk_messages(
    payload: MessageBulkCreateRequest,
    hr_user: User = Depends(require_role(UserRole.HR)),
    db: Session = Depends(get_db),
) -> list[MessageOut]:
    return message_service.send_bulk(db, hr_user, payload)


@router.get("/me", response_model=PaginatedResponse[MessageOut])
def list_inbox(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    candidate_user: User = Depends(require_role(UserRole.CANDIDATE)),
    db: Session = Depends(get_db),
) -> PaginatedResponse[MessageOut]:
    page_params = PageParams(page=page, page_size=page_size)
    items, total = message_service.list_inbox(db, candidate_user, page_params)
    return PaginatedResponse.build(
        [message_service.to_message_out(m) for m in items], total, page_params
    )


@router.get("/me/unread-count")
def get_unread_count(
    candidate_user: User = Depends(require_role(UserRole.CANDIDATE)),
    db: Session = Depends(get_db),
) -> dict:
    return {"unread_count": message_service.unread_count(db, candidate_user)}


@router.patch("/{message_id}/read", response_model=MessageOut)
def mark_read(
    message_id: uuid.UUID,
    candidate_user: User = Depends(require_role(UserRole.CANDIDATE)),
    db: Session = Depends(get_db),
) -> MessageOut:
    message = message_service.mark_read(db, message_id, candidate_user)
    return message_service.to_message_out(message)
