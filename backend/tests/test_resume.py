import io

from app.core.config import settings
from tests.conftest import auth_header
from tests.factories import create_candidate, create_hr

VALID_PDF_BYTES = b"%PDF-1.4\n%mock pdf content for tests\n"


def _upload(client, token_headers, filename, content, content_type):
    return client.post(
        "/api/v1/candidates/me/resume",
        files={"file": (filename, io.BytesIO(content), content_type)},
        headers=token_headers,
    )


def test_valid_pdf_upload_succeeds(client, db_session):
    candidate = create_candidate(db_session)

    response = _upload(client, auth_header(candidate), "resume.pdf", VALID_PDF_BYTES, "application/pdf")

    assert response.status_code == 201
    assert response.json()["has_resume"] is True


def test_uploaded_resume_can_be_downloaded(client, db_session):
    candidate = create_candidate(db_session)
    _upload(client, auth_header(candidate), "resume.pdf", VALID_PDF_BYTES, "application/pdf")

    response = client.get("/api/v1/candidates/me/resume", headers=auth_header(candidate))

    assert response.status_code == 200
    assert response.content == VALID_PDF_BYTES


def test_wrong_content_type_rejected(client, db_session):
    candidate = create_candidate(db_session)

    response = _upload(client, auth_header(candidate), "resume.txt", b"just text", "text/plain")

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "BAD_REQUEST"


def test_spoofed_content_type_with_bad_magic_bytes_rejected(client, db_session):
    """The Content-Type header claims application/pdf, but the actual bytes
    aren't a PDF -- this is the case the header check alone would miss."""
    candidate = create_candidate(db_session)

    response = _upload(
        client, auth_header(candidate), "resume.pdf", b"NOT-REALLY-A-PDF-BODY", "application/pdf"
    )

    assert response.status_code == 400
    assert "valid PDF" in response.json()["error"]["message"]


def test_oversized_resume_rejected(client, db_session):
    candidate = create_candidate(db_session)
    oversized = b"%PDF-1.4\n" + (b"a" * (settings.max_resume_size_bytes + 1))

    response = _upload(client, auth_header(candidate), "resume.pdf", oversized, "application/pdf")

    assert response.status_code == 400
    assert "smaller than" in response.json()["error"]["message"]


def test_download_own_resume_with_none_uploaded_is_404(client, db_session):
    candidate = create_candidate(db_session)

    response = client.get("/api/v1/candidates/me/resume", headers=auth_header(candidate))

    assert response.status_code == 404


def test_hr_can_download_candidate_resume(client, db_session):
    hr = create_hr(db_session)
    candidate = create_candidate(db_session)
    _upload(client, auth_header(candidate), "resume.pdf", VALID_PDF_BYTES, "application/pdf")

    response = client.get(f"/api/v1/candidates/{candidate.id}/resume", headers=auth_header(hr))

    assert response.status_code == 200
    assert response.content == VALID_PDF_BYTES


def test_other_candidate_cannot_download_resume(client, db_session):
    candidate1 = create_candidate(db_session)
    candidate2 = create_candidate(db_session)
    _upload(client, auth_header(candidate1), "resume.pdf", VALID_PDF_BYTES, "application/pdf")

    response = client.get(f"/api/v1/candidates/{candidate1.id}/resume", headers=auth_header(candidate2))

    assert response.status_code == 403
