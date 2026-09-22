from tests.conftest import auth_header
from tests.factories import (
    create_application,
    create_candidate,
    create_hr,
    create_job,
    create_message,
)


def test_hr_dashboard_stats_aggregate_correctly(client, db_session):
    hr = create_hr(db_session)
    candidate1 = create_candidate(db_session)
    candidate2 = create_candidate(db_session)
    active_job = create_job(db_session, hr, is_active=True)
    create_job(db_session, hr, is_active=False)

    create_application(db_session, active_job, candidate1, status="SHORTLISTED")
    create_application(db_session, active_job, candidate2, status="APPLIED")

    response = client.get("/api/v1/hr/dashboard/stats", headers=auth_header(hr))

    assert response.status_code == 200
    body = response.json()
    assert body["total_jobs"] == 2
    assert body["active_jobs"] == 1
    assert body["total_applicants"] == 2
    assert body["applied_count"] == 1
    assert body["shortlisted_count"] == 1
    assert body["rejected_count"] == 0
    assert len(body["applications_trend"]) == 14
    # today's bucket (last entry) should reflect the two applications just created
    assert body["applications_trend"][-1]["count"] == 2


def test_hr_dashboard_stats_scoped_to_own_jobs(client, db_session):
    hr1 = create_hr(db_session)
    hr2 = create_hr(db_session)
    candidate = create_candidate(db_session)
    hr2_job = create_job(db_session, hr2)
    create_application(db_session, hr2_job, candidate)

    response = client.get("/api/v1/hr/dashboard/stats", headers=auth_header(hr1))

    assert response.status_code == 200
    body = response.json()
    assert body["total_jobs"] == 0
    assert body["total_applicants"] == 0


def test_candidate_stats_aggregate_correctly(client, db_session):
    hr = create_hr(db_session)
    candidate = create_candidate(db_session)
    job1 = create_job(db_session, hr)
    job2 = create_job(db_session, hr)
    create_application(db_session, job1, candidate, status="SHORTLISTED")
    create_application(db_session, job2, candidate, status="APPLIED")
    create_message(db_session, hr, candidate)
    create_message(db_session, hr, candidate)

    response = client.get("/api/v1/candidates/me/stats", headers=auth_header(candidate))

    assert response.status_code == 200
    body = response.json()
    assert body["total_applications"] == 2
    assert body["applied_count"] == 1
    assert body["shortlisted_count"] == 1
    assert body["unread_messages"] == 2
