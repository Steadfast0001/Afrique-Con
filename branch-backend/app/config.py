from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    branch_db_host: str = "localhost"
    branch_db_port: int = 5432
    branch_db_name: str = "branch_db"
    branch_db_user: str = "branch_user"
    branch_db_password: str = "secret"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


def get_settings() -> Settings:
    return Settings()
