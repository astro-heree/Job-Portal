from tests.conftest import auth_header
from tests.factories import create_candidate, create_hr, create_message


def test_hr_can_send_bulk_message(client, db_session):
    hr = create_hr(db_session, company_name="Acme Corp")
    candidate1 = create_candidate(db_session)
    candidate2 = create_candidate(db_session)

    response = client.post(
        "/api/v1/messages/bulk",
        json={
            "recipient_candidate_ids": [str(candidate1.id), str(candidate2.id)],
            "subject": "Interview",
            "body": "Are you available this week?",
        },
        headers=auth_header(hr),
    )

    assert response.status_code == 201
    body = response.json()
    assert len(body) == 2
    assert all(m["sender_company_name"] == "Acme Corp" for m in body)


def test_bulk_message_ignores_non_candidate_recipients(client, db_session):
    hr = create_hr(db_session)
    other_hr = create_hr(db_session)
    candidate = create_candidate(db_session)

    response = client.post(
        "/api/v1/messages/bulk",
        json={
            "recipient_candidate_ids": [str(candidate.id), str(other_hr.id)],
            "subject": "Interview",
            "body": "Hello",
        },
        headers=auth_header(hr),
    )

    assert response.status_code == 201
    assert len(response.json()) == 1


def test_candidate_cannot_send_messages(client, db_session):
    candidate = create_candidate(db_session)

    response = client.post(
        "/api/v1/messages/bulk",
        json={"recipient_candidate_ids": [str(candidate.id)], "subject": "x", "body": "y"},
        headers=auth_header(candidate),
    )

    assert response.status_code == 403


def test_candidate_sees_inbox_and_unread_count(client, db_session):
    hr = create_hr(db_session)
    candidate = create_candidate(db_session)
    create_message(db_session, hr, candidate, subject="First")
    create_message(db_session, hr, candidate, subject="Second")

    response = client.get("/api/v1/messages/me", headers=auth_header(candidate))
    assert response.status_code == 200
    assert response.json()["total"] == 2

    response = client.get("/api/v1/messages/me/unread-count", headers=auth_header(candidate))
    assert response.json()["unread_count"] == 2


def test_mark_message_read_updates_unread_count(client, db_session):
    hr = create_hr(db_session)
    candidate = create_candidate(db_session)
    message = create_message(db_session, hr, candidate)

    response = client.patch(f"/api/v1/messages/{message.id}/read", headers=auth_header(candidate))
    assert response.status_code == 200
    assert response.json()["read_at"] is not None

    response = client.get("/api/v1/messages/me/unread-count", headers=auth_header(candidate))
    assert response.json()["unread_count"] == 0


def test_other_candidate_cannot_mark_message_read(client, db_session):
    hr = create_hr(db_session)
    candidate1 = create_candidate(db_session)
    candidate2 = create_candidate(db_session)
    message = create_message(db_session, hr, candidate1)

    response = client.patch(f"/api/v1/messages/{message.id}/read", headers=auth_header(candidate2))

    assert response.status_code == 403
