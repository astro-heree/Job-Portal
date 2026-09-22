"""Rate limiting on the two unauthenticated auth endpoints. The `client`
fixture resets the slowapi limiter's in-memory storage before every test
(see conftest.py), so these counts start from zero regardless of what ran
before -- without that reset, test order would silently change the result.
"""

from app.core.config import settings


def _limit_count(limit_string: str) -> int:
    # slowapi limit strings look like "5/minute"
    return int(limit_string.split("/")[0])


def test_login_rate_limited_after_threshold(client):
    limit = _limit_count(settings.rate_limit_login)

    last_response = None
    for _ in range(limit + 1):
        last_response = client.post(
            "/api/v1/auth/login", json={"email": "nobody@jobportal.dev", "password": "WrongPassword1"}
        )

    assert last_response.status_code == 429
    assert last_response.json()["error"]["code"] == "RATE_LIMITED"


def test_login_under_threshold_not_limited(client):
    limit = _limit_count(settings.rate_limit_login)

    for _ in range(limit):
        response = client.post(
            "/api/v1/auth/login", json={"email": "nobody@jobportal.dev", "password": "WrongPassword1"}
        )
        assert response.status_code == 401  # rejected for bad credentials, not rate limiting


def test_register_rate_limited_after_threshold(client):
    limit = _limit_count(settings.rate_limit_register)

    last_response = None
    for i in range(limit + 1):
        last_response = client.post(
            "/api/v1/auth/register",
            json={
                "email": f"burst{i}@jobportal.dev",
                "password": "Password123!",
                "full_name": "Burst",
                "role": "CANDIDATE",
            },
        )

    assert last_response.status_code == 429
    assert last_response.json()["error"]["code"] == "RATE_LIMITED"
