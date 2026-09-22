import uuid
from pathlib import Path

from app.core.config import settings
from app.core.exceptions import BadRequestError

_PDF_MAGIC_BYTES = b"%PDF-"
_ALLOWED_CONTENT_TYPES = {"application/pdf"}


def resume_path(candidate_id: uuid.UUID) -> Path:
    return Path(settings.upload_dir) / f"{candidate_id}.pdf"


def validate_resume_upload(*, content_type: str | None, content: bytes) -> None:
    """Three independent checks, because a client-declared Content-Type
    header can't be trusted on its own for a security-relevant upload gate:
    an attacker can label any file "application/pdf"."""
    if content_type not in _ALLOWED_CONTENT_TYPES:
        raise BadRequestError("Resume must be a PDF file")

    if len(content) > settings.max_resume_size_bytes:
        max_mb = settings.max_resume_size_bytes // (1024 * 1024)
        raise BadRequestError(f"Resume must be smaller than {max_mb}MB")

    if not content.startswith(_PDF_MAGIC_BYTES):
        raise BadRequestError("File does not appear to be a valid PDF")


def save_resume(candidate_id: uuid.UUID, content: bytes) -> str:
    path = resume_path(candidate_id)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(content)
    return path.name


def delete_resume(candidate_id: uuid.UUID) -> None:
    path = resume_path(candidate_id)
    path.unlink(missing_ok=True)
