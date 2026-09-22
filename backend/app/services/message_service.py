import uuid
from datetime import datetime, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.enums import UserRole
from app.models.message import Message
from app.models.user import User
from app.schemas.message import MessageBulkCreateRequest, MessageOut
from app.schemas.pagination import PageParams


def to_message_out(message: Message) -> MessageOut:
    sender_profile = message.sender.hr_profile if message.sender else None
    return MessageOut(
        id=message.id,
        sender_hr_id=message.sender_hr_id,
        sender_company_name=sender_profile.company_name if sender_profile else None,
        subject=message.subject,
        body=message.body,
        sent_at=message.sent_at,
        read_at=message.read_at,
    )


def send_bulk(db: Session, hr_user: User, payload: MessageBulkCreateRequest) -> list[MessageOut]:
    # Only send to ids that actually resolve to CANDIDATE accounts -- silently
    # drop anything else rather than letting a bad id fail the whole batch.
    valid_recipients = (
        db.query(User.id)
        .filter(User.id.in_(payload.recipient_candidate_ids), User.role == UserRole.CANDIDATE)
        .all()
    )
    recipient_ids = [row[0] for row in valid_recipients]

    messages = [
        Message(
            sender_hr_id=hr_user.id,
            recipient_candidate_id=recipient_id,
            subject=payload.subject,
            body=payload.body,
        )
        for recipient_id in recipient_ids
    ]
    db.add_all(messages)
    db.commit()
    for message in messages:
        db.refresh(message)
    return [to_message_out(m) for m in messages]


def list_inbox(
    db: Session, candidate_user: User, page_params: PageParams
) -> tuple[list[Message], int]:
    query = (
        db.query(Message)
        .options(joinedload(Message.sender).joinedload(User.hr_profile))
        .filter(Message.recipient_candidate_id == candidate_user.id)
    )
    total = query.count()
    items = (
        query.order_by(Message.sent_at.desc())
        .offset(page_params.offset)
        .limit(page_params.page_size)
        .all()
    )
    return items, total


def unread_count(db: Session, candidate_user: User) -> int:
    return (
        db.query(func.count(Message.id))
        .filter(Message.recipient_candidate_id == candidate_user.id, Message.read_at.is_(None))
        .scalar()
        or 0
    )


def mark_read(db: Session, message_id: uuid.UUID, candidate_user: User) -> Message:
    message = db.get(Message, message_id)
    if message is None:
        raise NotFoundError("Message not found")
    if message.recipient_candidate_id != candidate_user.id:
        raise ForbiddenError("You do not have access to this message")

    if message.read_at is None:
        message.read_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(message)
    return message
