from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.security import create_access_token, hash_password, verify_password
from app.models.candidate_profile import CandidateProfile
from app.models.enums import UserRole
from app.models.hr_profile import HRProfile
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest


def register_user(db: Session, payload: RegisterRequest) -> User:
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing is not None:
        raise ConflictError("An account with this email already exists")

    user = User(
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role,
    )
    db.add(user)
    db.flush()  # populate user.id for the profile FK before commit

    if payload.role == UserRole.HR:
        db.add(HRProfile(user_id=user.id, company_name=(payload.company_name or "").strip()))
    else:
        db.add(CandidateProfile(user_id=user.id))

    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, payload: LoginRequest) -> User:
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise UnauthorizedError("Invalid email or password")
    if not user.is_active:
        raise UnauthorizedError("This account has been deactivated")
    return user


def issue_token(user: User) -> str:
    return create_access_token(subject=str(user.id))
