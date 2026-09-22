from app.models.enums import ApplicationStatus
from tests.conftest import auth_header
from tests.factories import create_application, create_candidate, create_hr, create_job


def test_candidate_sees_own_applications_with_job_context(client, db_session):
    hr = create_hr(db_session, company_name="Acme Corp")
    candidate = create_candidate(db_session)
    job1 = create_job(db_session, hr, title="Backend Engineer")
    job2 = create_job(db_session, hr, title="Frontend Engineer")
    create_application(db_session, job1, candidate)
    create_application(db_session, job2, candidate)

    response = client.get("/api/v1/applications/me", headers=auth_header(candidate))

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 2
    titles = {item["job_title"] for item in body["items"]}
    assert titles == {"Backend Engineer", "Frontend Engineer"}
    assert all(item["company_name"] == "Acme Corp" for item in body["items"])


def test_candidate_with_no_applications_sees_empty_list(client, db_session):
    candidate = create_candidate(db_session)

    response = client.get("/api/v1/applications/me", headers=auth_header(candidate))

    assert response.status_code == 200
    assert response.json()["total"] == 0


def test_candidate_can_view_own_application_detail(client, db_session):
    hr = create_hr(db_session)
    candidate = create_candidate(db_session)
    job = create_job(db_session, hr)
    application = create_application(db_session, job, candidate)

    response = client.get(f"/api/v1/applications/{application.id}", headers=auth_header(candidate))

    assert response.status_code == 200
    assert response.json()["id"] == str(application.id)


def test_other_candidate_cannot_view_application(client, db_session):
    hr = create_hr(db_session)
    candidate1 = create_candidate(db_session)
    candidate2 = create_candidate(db_session)
    job = create_job(db_session, hr)
    application = create_application(db_session, job, candidate1)

    response = client.get(f"/api/v1/applications/{application.id}", headers=auth_header(candidate2))

    assert response.status_code == 403


def test_owning_hr_can_view_application(client, db_session):
    hr = create_hr(db_session)
    candidate = create_candidate(db_session)
    job = create_job(db_session, hr)
    application = create_application(db_session, job, candidate)

    response = client.get(f"/api/v1/applications/{application.id}", headers=auth_header(hr))

    assert response.status_code == 200


def test_non_owning_hr_cannot_view_application(client, db_session):
    hr1 = create_hr(db_session)
    hr2 = create_hr(db_session)
    candidate = create_candidate(db_session)
    job = create_job(db_session, hr1)
    application = create_application(db_session, job, candidate)

    response = client.get(f"/api/v1/applications/{application.id}", headers=auth_header(hr2))

    assert response.status_code == 403


def test_owning_hr_can_update_application_status(client, db_session):
    hr = create_hr(db_session)
    candidate = create_candidate(db_session)
    job = create_job(db_session, hr)
    application = create_application(db_session, job, candidate)

    response = client.patch(
        f"/api/v1/applications/{application.id}/status",
        json={"status": "SHORTLISTED"},
        headers=auth_header(hr),
    )

    assert response.status_code == 200
    assert response.json()["status"] == "SHORTLISTED"


def test_non_owning_hr_cannot_update_application_status(client, db_session):
    hr1 = create_hr(db_session)
    hr2 = create_hr(db_session)
    candidate = create_candidate(db_session)
    job = create_job(db_session, hr1)
    application = create_application(db_session, job, candidate)

    response = client.patch(
        f"/api/v1/applications/{application.id}/status",
        json={"status": "REJECTED"},
        headers=auth_header(hr2),
    )

    assert response.status_code == 403


def test_bulk_status_update_only_touches_owned_applications(client, db_session):
    hr1 = create_hr(db_session)
    hr2 = create_hr(db_session)
    candidate = create_candidate(db_session)
    job1 = create_job(db_session, hr1)
    job2 = create_job(db_session, hr2)
    owned_application = create_application(db_session, job1, candidate)
    other_application = create_application(db_session, job2, candidate)

    response = client.patch(
        "/api/v1/applications/bulk-status",
        json={
            "application_ids": [str(owned_application.id), str(other_application.id)],
            "status": "REJECTED",
        },
        headers=auth_header(hr1),
    )

    assert response.status_code == 200
    updated_ids = {item["id"] for item in response.json()}
    assert updated_ids == {str(owned_application.id)}

    db_session.refresh(other_application)
    assert other_application.status == ApplicationStatus.APPLIED
