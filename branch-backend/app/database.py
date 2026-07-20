from __future__ import annotations

import os
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import get_settings
from app.models import Base

settings = get_settings()

if os.getenv("BRANCH_DB_URL"):
    SQLALCHEMY_DATABASE_URL = os.environ["BRANCH_DB_URL"]
elif os.getenv("PYTEST_CURRENT_TEST") or os.getenv("BRANCH_DB_USE_SQLITE") == "1":
    SQLALCHEMY_DATABASE_URL = "sqlite:///./branch_backend_test.db"
elif os.getenv("BRANCH_DB_HOST") or os.getenv("BRANCH_DB_PORT") or os.getenv("BRANCH_DB_NAME") or os.getenv("BRANCH_DB_USER"):
    SQLALCHEMY_DATABASE_URL = (
        f"postgresql://{settings.branch_db_user}:{settings.branch_db_password}"
        f"@{settings.branch_db_host}:{settings.branch_db_port}/{settings.branch_db_name}"
    )
else:
    SQLALCHEMY_DATABASE_URL = "sqlite:///./branch_backend_test.db"

connect_args = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
