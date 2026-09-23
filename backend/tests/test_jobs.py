from tests.conftest import auth_header
from tests.factories import create_application, create_candidate, create_hr, create_job

JOB_PAYLOAD = {
    "title": "Backend Engineer",
    "description": "Build APIs",
    "skills": ["Python", "FastAPI"],
    "location": "Remote",
    "employment_type": "FULL_TIME",
    "min_experience_years": 2,
    "max_experience_years": 6,
    "salary_min": 80000,
    "salary_max": 120000,
}


def test_hr_can_create_job(client, db_session):
    hr = create_hr(db_session, company_name="Acme Corp")

    response = client.post("/api/v1/jobs", json=JOB_PAYLOAD, headers=auth_header(hr))

    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "Backend Engineer"
    assert body["company_name"] == "Acme Corp"
    assert body["is_active"] is True


def test_candidate_cannot_create_job(client, db_session):
    candidate = create_candidate(db_session)

    response = client.post("/api/v1/jobs", json=JOB_PAYLOAD, headers=auth_header(candidate))

    assert response.status_code == 403


def test_create_job_rejects_invalid_experience_range(client, db_session):
    hr = create_hr(db_session)
    bad_payload = dict(JOB_PAYLOAD, min_experience_years=10, max_experience_years=2)

    response = client.post("/api/v1/jobs", json=bad_payload, headers=auth_header(hr))

    assert response.status_code == 422


def test_create_job_rejects_invalid_salary_range(client, db_session):
    hr = create_hr(db_session)
    bad_payload = dict(JOB_PAYLOAD, salary_min=150000, salary_max=100000)

    response = client.post("/api/v1/jobs", json=bad_payload, headers=auth_header(hr))

    assert response.status_code == 422


def test_public_list_only_returns_active_jobs(client, db_session):
    hr = create_hr(db_session)
    create_job(db_session, hr, title="Active Job", is_active=True)
    create_job(db_session, hr, title="Inactive Job", is_active=False)

    response = client.get("/api/v1/jobs")

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["title"] == "Active Job"


def test_search_filters_by_query_and_location(client, db_session):
    hr = create_hr(db_session)
    create_job(db_session, hr, title="Backend Engineer", location="Remote")
    create_job(db_session, hr, title="Sales Manager", location="New York")

    response = client.get("/api/v1/jobs", params={"q": "Backend"})
    assert response.json()["total"] == 1

    response = client.get("/api/v1/jobs", params={"location": "New York"})
    assert response.json()["total"] == 1
    assert response.json()["items"][0]["title"] == "Sales Manager"


def test_search_skills_filter_is_a_case_insensitive_substring_match(client, db_session):
    hr = create_hr(db_session)
    create_job(db_session, hr, title="Frontend Role", skills=["TypeScript"])
    create_job(db_session, hr, title="Backend Role", skills=["python"])

    response = client.get("/api/v1/jobs", params={"skills": "script"})
    assert response.json()["total"] == 1
    assert response.json()["items"][0]["title"] == "Frontend Role"

    response = client.get("/api/v1/jobs", params={"skills": "PYTHON"})
    assert response.json()["total"] == 1
    assert response.json()["items"][0]["title"] == "Backend Role"


def test_get_inactive_job_is_404_for_public_but_visible_to_owner(client, db_session):
    hr = create_hr(db_session)
    job = create_job(db_session, hr, is_active=False)

    response = client.get(f"/api/v1/jobs/{job.id}")
    assert response.status_code == 404

    response = client.get(f"/api/v1/jobs/{job.id}", headers=auth_header(hr))
    assert response.status_code == 200


def test_cross_tenant_update_is_forbidden(client, db_session):
    hr1 = create_hr(db_session, company_name="Acme Corp")
    hr2 = create_hr(db_session, company_name="Globex Inc")
    job = create_job(db_session, hr1)

    response = client.patch(
        f"/api/v1/jobs/{job.id}", json={"title": "Hijacked"}, headers=auth_header(hr2)
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "FORBIDDEN"


def test_cross_tenant_status_change_is_forbidden(client, db_session):
    hr1 = create_hr(db_session)
    hr2 = create_hr(db_session)
    job = create_job(db_session, hr1)

    response = client.patch(
        f"/api/v1/jobs/{job.id}/status", json={"is_active": False}, headers=auth_header(hr2)
    )

    assert response.status_code == 403


def test_owner_can_update_and_deactivate_job(client, db_session):
    hr = create_hr(db_session)
    job = create_job(db_session, hr)

    response = client.patch(
        f"/api/v1/jobs/{job.id}", json={"title": "Senior Backend Engineer"}, headers=auth_header(hr)
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Senior Backend Engineer"

    response = client.patch(
        f"/api/v1/jobs/{job.id}/status", json={"is_active": False}, headers=auth_header(hr)
    )
    assert response.status_code == 200
    assert response.json()["is_active"] is False


def test_candidate_can_apply_to_job(client, db_session):
    hr = create_hr(db_session)
    candidate = create_candidate(db_session, skills=["Python"], experience_years=3)
    job = create_job(db_session, hr, skills=["Python"], min_experience_years=1, max_experience_years=5)

    response = client.post(
        f"/api/v1/jobs/{job.id}/apply", json={"cover_note": "I would love this role"}, headers=auth_header(candidate)
    )

    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "APPLIED"
    assert body["ats_score"] > 0


def test_duplicate_application_conflicts(client, db_session):
    hr = create_hr(db_session)
    candidate = create_candidate(db_session)
    job = create_job(db_session, hr)
    create_application(db_session, job, candidate)

    response = client.post(f"/api/v1/jobs/{job.id}/apply", json={}, headers=auth_header(candidate))

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "CONFLICT"


def test_applying_to_inactive_job_is_404(client, db_session):
    hr = create_hr(db_session)
    candidate = create_candidate(db_session)
    job = create_job(db_session, hr, is_active=False)

    response = client.post(f"/api/v1/jobs/{job.id}/apply", json={}, headers=auth_header(candidate))

    assert response.status_code == 404


def test_hr_cannot_apply_to_job(client, db_session):
    hr = create_hr(db_session)
    job = create_job(db_session, hr)

    response = client.post(f"/api/v1/jobs/{job.id}/apply", json={}, headers=auth_header(hr))

    assert response.status_code == 403


def test_owner_can_list_applicants_sorted_by_ats_rating(client, db_session):
    hr = create_hr(db_session)
    job = create_job(db_session, hr, skills=["Python"], min_experience_years=1, max_experience_years=5)

    strong_fit = create_candidate(db_session, skills=["Python"], experience_years=3)
    weak_fit = create_candidate(db_session, skills=["Cobol"], experience_years=None)
    create_application(db_session, job, strong_fit)
    create_application(db_session, job, weak_fit)

    response = client.get(f"/api/v1/jobs/{job.id}/applications", headers=auth_header(hr))

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 2
    ats_ratings = [item["ats_rating"] for item in body["items"]]
    assert ats_ratings == sorted(ats_ratings, reverse=True)
    assert body["items"][0]["candidate_email"] == strong_fit.email


def test_applicants_can_be_filtered_by_candidate_attributes(client, db_session):
    hr = create_hr(db_session)
    job = create_job(db_session, hr)

    remote_python = create_candidate(
        db_session,
        full_name="Remote Python Dev",
        skills=["Python", "Django"],
        location="Remote",
        experience_years=6,
        expected_salary=90000,
    )
    onsite_java = create_candidate(
        db_session,
        full_name="Onsite Java Dev",
        skills=["Java"],
        location="New York",
        experience_years=2,
        expected_salary=180000,
    )
    create_application(db_session, job, remote_python)
    create_application(db_session, job, onsite_java)

    # skills: case-insensitive substring, not exact element match
    response = client.get(
        f"/api/v1/jobs/{job.id}/applications", params={"skills": "django"}, headers=auth_header(hr)
    )
    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert response.json()["items"][0]["candidate_full_name"] == "Remote Python Dev"

    response = client.get(
        f"/api/v1/jobs/{job.id}/applications", params={"location": "New York"}, headers=auth_header(hr)
    )
    assert response.json()["total"] == 1
    assert response.json()["items"][0]["candidate_full_name"] == "Onsite Java Dev"

    response = client.get(
        f"/api/v1/jobs/{job.id}/applications", params={"min_experience_years": 5}, headers=auth_header(hr)
    )
    assert response.json()["total"] == 1
    assert response.json()["items"][0]["candidate_full_name"] == "Remote Python Dev"

    # max_salary is a budget ceiling: applicants expecting AT MOST this much
    response = client.get(
        f"/api/v1/jobs/{job.id}/applications", params={"max_salary": 100000}, headers=auth_header(hr)
    )
    assert response.json()["total"] == 1
    assert response.json()["items"][0]["candidate_full_name"] == "Remote Python Dev"


def test_non_owner_cannot_list_applicants(client, db_session):
    hr1 = create_hr(db_session)
    hr2 = create_hr(db_session)
    job = create_job(db_session, hr1)

    response = client.get(f"/api/v1/jobs/{job.id}/applications", headers=auth_header(hr2))

    assert response.status_code == 403
