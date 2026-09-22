from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Typed application configuration, read once from the environment.

    Read everywhere via the `settings` singleton below instead of scattering
    `os.environ.get(...)` calls through the codebase.
    """

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"

    database_url: str = "postgresql+psycopg2://jobportal:jobportal_dev_password@db:5432/jobportal"

    secret_key: str = "dev-only-secret-change-me"
    access_token_expire_minutes: int = 1440
    jwt_algorithm: str = "HS256"

    frontend_origin: str = "http://localhost:3001"

    seed_demo_data: bool = True

    upload_dir: str = "/app/uploads"
    max_resume_size_bytes: int = 5 * 1024 * 1024

    rate_limit_login: str = "5/minute"
    rate_limit_register: str = "3/minute"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
