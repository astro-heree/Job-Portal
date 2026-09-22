from tests.conftest import auth_header
from tests.factories import create_candidate, create_hr


def test_register_hr_success(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "new-hr@jobportal.dev",
            "password": "Password123!",
            "full_name": "New HR",
            "role": "HR",
            "company_name": "Acme Corp",
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["user"]["role"] == "HR"
    assert "access_token" in body


def test_register_candidate_success(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "new-candidate@jobportal.dev",
            "password": "Password123!",
            "full_name": "New Candidate",
            "role": "CANDIDATE",
        },
    )
    assert response.status_code == 201
    assert response.json()["user"]["role"] == "CANDIDATE"


def test_register_hr_without_company_name_fails(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "no-company@jobportal.dev",
            "password": "Password123!",
            "full_name": "No Company",
            "role": "HR",
        },
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_register_password_too_short_fails(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "short-pw@jobportal.dev",
            "password": "short",
            "full_name": "Short Password",
            "role": "CANDIDATE",
        },
    )
    assert response.status_code == 422


def test_register_duplicate_email_conflicts(client, db_session):
    create_hr(db_session, email="existing-hr@jobportal.dev")

    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "existing-hr@jobportal.dev",
            "password": "Password123!",
            "full_name": "Duplicate",
            "role": "HR",
            "company_name": "Acme Corp",
        },
    )
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "CONFLICT"


def test_login_success(client, db_session):
    create_hr(db_session, email="login-hr@jobportal.dev")

    response = client.post(
        "/api/v1/auth/login", json={"email": "login-hr@jobportal.dev", "password": "Password123!"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_wrong_password_fails(client, db_session):
    create_hr(db_session, email="wrong-pw@jobportal.dev")

    response = client.post(
        "/api/v1/auth/login", json={"email": "wrong-pw@jobportal.dev", "password": "WrongPassword1"}
    )
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHORIZED"


def test_login_unknown_email_fails(client):
    response = client.post(
        "/api/v1/auth/login", json={"email": "nobody@jobportal.dev", "password": "Password123!"}
    )
    assert response.status_code == 401


def test_login_inactive_user_rejected(client, db_session):
    user = create_candidate(db_session, email="inactive@jobportal.dev", is_active=False)

    response = client.post(
        "/api/v1/auth/login", json={"email": user.email, "password": "Password123!"}
    )
    assert response.status_code == 401


def test_me_requires_token(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_me_returns_current_user(client, db_session):
    user = create_candidate(db_session, email="me-check@jobportal.dev")

    response = client.get("/api/v1/auth/me", headers=auth_header(user))
    assert response.status_code == 200
    assert response.json()["email"] == "me-check@jobportal.dev"
