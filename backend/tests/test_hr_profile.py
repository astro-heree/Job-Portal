from tests.conftest import auth_header
from tests.factories import create_hr, create_job


def test_hr_can_view_own_profile(client, db_session):
    hr = create_hr(db_session, company_name="Acme Corp", designation="Recruiter")

    response = client.get("/api/v1/hr/me", headers=auth_header(hr))

    assert response.status_code == 200
    assert response.json()["company_name"] == "Acme Corp"
    assert response.json()["designation"] == "Recruiter"


def test_hr_can_update_own_profile(client, db_session):
    hr = create_hr(db_session, company_name="Acme Corp")

    response = client.patch(
        "/api/v1/hr/me", json={"designation": "Talent Lead"}, headers=auth_header(hr)
    )

    assert response.status_code == 200
    assert response.json()["designation"] == "Talent Lead"
    assert response.json()["company_name"] == "Acme Corp"


def test_hr_sees_only_their_own_jobs(client, db_session):
    hr1 = create_hr(db_session)
    hr2 = create_hr(db_session)
    create_job(db_session, hr1, title="HR1 Job A")
    create_job(db_session, hr1, title="HR1 Job B")
    create_job(db_session, hr2, title="HR2 Job")

    response = client.get("/api/v1/hr/jobs", headers=auth_header(hr1))

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 2
    titles = {item["title"] for item in body["items"]}
    assert titles == {"HR1 Job A", "HR1 Job B"}
