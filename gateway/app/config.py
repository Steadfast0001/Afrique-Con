from __future__ import annotations

import json
from typing import Any

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    branch_routes: dict[str, str] = Field(default_factory=lambda: {
        "buea": "http://localhost:8000",
        "douala": "http://localhost:8001",
    })
    log_level: str = "info"
    service_name: str = "gateway"
    system_branches_database_url: str | None = None
    super_admin_token: str = "change-me-super-admin-token"

    @field_validator("branch_routes", mode="before")
    @classmethod
    def parse_branch_routes(cls, value: Any) -> dict[str, str]:
        if isinstance(value, str):
            try:
                parsed = json.loads(value)
                if isinstance(parsed, dict):
                    return parsed
            except ValueError:
                parts = [part.strip() for part in value.split(",") if part.strip()]
                mapping: dict[str, str] = {}
                for part in parts:
                    if "=" in part:
                        key, target = part.split("=", 1)
                        mapping[key.strip()] = target.strip()
                return mapping
        return value

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
    }


def get_settings() -> Settings:
    return Settings()
