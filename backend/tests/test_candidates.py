from tests.conftest import auth_header
from tests.factories import create_candidate, create_hr


def test_candidate_can_view_own_profile(client, db_session):
    candidate = create_candidate(db_session, headline="Backend dev", skills=["Python"])

    response = client.get("/api/v1/candidates/me", headers=auth_header(candidate))

    assert response.status_code == 200
    assert response.json()["headline"] == "Backend dev"
    assert response.json()["skills"] == ["Python"]


def test_candidate_can_update_own_profile(client, db_session):
    candidate = create_candidate(db_session)

    response = client.patch(
        "/api/v1/candidates/me",
        json={
            "headline": "Senior Engineer",
            "skills": ["Python", "Python", " Go "],
            "location": "Remote",
            "expected_salary": 120000,
        },
        headers=auth_header(candidate),
    )

    assert response.status_code == 200
    body = response.json()
    assert body["headline"] == "Senior Engineer"
    assert sorted(body["skills"]) == ["Go", "Python"]
    assert body["location"] == "Remote"
    assert body["expected_salary"] == 120000


def test_hr_cannot_access_candidate_self_endpoints(client, db_session):
    hr = create_hr(db_session)

    response = client.get("/api/v1/candidates/me", headers=auth_header(hr))

    assert response.status_code == 403


def test_hr_can_search_candidate_directory(client, db_session):
    hr = create_hr(db_session)
    create_candidate(db_session, skills=["Python"], location="Remote")
    create_candidate(db_session, skills=["Java"], location="New York")

    response = client.get("/api/v1/candidates", headers=auth_header(hr))
    assert response.status_code == 200
    assert response.json()["total"] == 2

    response = client.get("/api/v1/candidates", params={"skills": "Python"}, headers=auth_header(hr))
    assert response.json()["total"] == 1


def test_skills_filter_is_a_case_insensitive_substring_match(client, db_session):
    hr = create_hr(db_session)
    create_candidate(db_session, full_name="TS Dev", skills=["TypeScript"])
    create_candidate(db_session, full_name="Py Dev", skills=["python"])

    # "script" is a substring of "TypeScript", not an exact element match
    response = client.get("/api/v1/candidates", params={"skills": "script"}, headers=auth_header(hr))
    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert response.json()["items"][0]["full_name"] == "TS Dev"

    # case-insensitive against a differently-cased stored skill
    response = client.get("/api/v1/candidates", params={"skills": "PYTHON"}, headers=auth_header(hr))
    assert response.json()["total"] == 1
    assert response.json()["items"][0]["full_name"] == "Py Dev"


def test_hr_can_filter_directory_by_experience_and_salary(client, db_session):
    hr = create_hr(db_session)
    create_candidate(db_session, full_name="Junior Dev", experience_years=1, expected_salary=60000)
    create_candidate(db_session, full_name="Senior Dev", experience_years=8, expected_salary=150000)

    response = client.get(
        "/api/v1/candidates", params={"min_experience_years": 5}, headers=auth_header(hr)
    )
    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert response.json()["items"][0]["full_name"] == "Senior Dev"

    response = client.get("/api/v1/candidates", params={"min_salary": 100000}, headers=auth_header(hr))
    assert response.json()["total"] == 1
    assert response.json()["items"][0]["full_name"] == "Senior Dev"

    response = client.get("/api/v1/candidates", params={"min_salary": 200000}, headers=auth_header(hr))
    assert response.json()["total"] == 0


def test_candidate_cannot_access_directory(client, db_session):
    candidate = create_candidate(db_session)

    response = client.get("/api/v1/candidates", headers=auth_header(candidate))

    assert response.status_code == 403


def test_hr_can_view_candidate_detail(client, db_session):
    hr = create_hr(db_session)
    candidate = create_candidate(db_session, headline="Data Engineer")

    response = client.get(f"/api/v1/candidates/{candidate.id}", headers=auth_header(hr))

    assert response.status_code == 200
    assert response.json()["headline"] == "Data Engineer"


def test_candidate_cannot_view_another_candidate_detail(client, db_session):
    candidate1 = create_candidate(db_session)
    candidate2 = create_candidate(db_session)

    response = client.get(f"/api/v1/candidates/{candidate2.id}", headers=auth_header(candidate1))

    assert response.status_code == 403
