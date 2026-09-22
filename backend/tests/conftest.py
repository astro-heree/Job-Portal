"""Pytest configuration: an isolated Postgres test database, per-test
transaction rollback via savepoints, and a TestClient wired to it.

Real Postgres, not SQLite, because the schema uses ARRAY columns with GIN
indexes that SQLite doesn't support -- faking that with SQLite would test a
different schema than the one actually shipped.
"""

import os
import shutil
import tempfile

import psycopg2
import pytest
from psycopg2 import errors as pg_errors
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker

# --- Environment must be finalized before the first `from app...` import,
# since app.core.config.settings is a module-level singleton read at import
# time. ---

_UPLOAD_DIR = tempfile.mkdtemp(prefix="jobportal-test-uploads-")
os.environ["UPLOAD_DIR"] = _UPLOAD_DIR
os.environ.setdefault("SECRET_KEY", "test-secret-key-do-not-use-in-production")
os.environ.setdefault("FRONTEND_ORIGIN", "http://localhost:3001")

_base_url = make_url(
    os.environ.get(
        "DATABASE_URL",
        "postgresql+psycopg2://jobportal:jobportal_dev_password@localhost:5434/jobportal",
    )
)
_test_db_name = f"{_base_url.database}_test"
_test_url = _base_url.set(database=_test_db_name)
os.environ["DATABASE_URL"] = _test_url.render_as_string(hide_password=False)


def _ensure_test_database_exists() -> None:
    admin_conn = psycopg2.connect(
        dbname="postgres",
        user=_base_url.username,
        password=_base_url.password,
        host=_base_url.host,
        port=_base_url.port,
    )
    admin_conn.autocommit = True
    try:
        with admin_conn.cursor() as cursor:
            try:
                cursor.execute(f'CREATE DATABASE "{_test_db_name}"')
            except pg_errors.DuplicateDatabase:
                pass
    finally:
        admin_conn.close()


_ensure_test_database_exists()

from fastapi.testclient import TestClient  # noqa: E402

from app.core.rate_limit import limiter  # noqa: E402
from app.core.security import create_access_token  # noqa: E402
from app.db.session import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models.user import User  # noqa: E402

engine = create_engine(_test_url)


@pytest.fixture(scope="session", autouse=True)
def _test_schema():
    Base.metadata.create_all(engine)
    yield
    Base.metadata.drop_all(engine)
    shutil.rmtree(_UPLOAD_DIR, ignore_errors=True)


@pytest.fixture()
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session_factory = sessionmaker(bind=connection, join_transaction_mode="create_savepoint")
    session = session_factory()
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture()
def client(db_session):
    def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    limiter.reset()
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.clear()


def auth_header(user: User) -> dict[str, str]:
    return {"Authorization": f"Bearer {create_access_token(subject=str(user.id))}"}
