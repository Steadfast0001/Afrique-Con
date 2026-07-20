from __future__ import annotations

from datetime import datetime, timedelta

import bcrypt
import jwt
import pytest
from fastapi.testclient import TestClient

from auth import (
    ACCESS_TOKEN_EXPIRES_MINUTES,
    JWT_ALGORITHM,
    JWT_SECRET,
    REFRESH_TOKEN_EXPIRES_DAYS,
    app,
    create_access_token,
    create_refresh_token,
    decode_jwt_token,
    get_password_hash,
    verify_password,
)

client = TestClient(app)


def test_password_hash_and_verify() -> None:
    password = "strongP@ssw0rd"
    hashed = get_password_hash(password)

    assert hashed != password
    assert verify_password(password, hashed)
    assert not verify_password("wrong", hashed)


def test_login_returns_tokens() -> None:
    response = client.post(
        "/login",
        data={"username": "admin@example.com", "password": "secret123"},
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"

    decoded = jwt.decode(data["access_token"], JWT_SECRET, algorithms=[JWT_ALGORITHM])
    assert decoded["sub"] == "admin@example.com"
    assert decoded["type"] == "access"


def test_refresh_returns_new_access_token() -> None:
    refresh_token = create_refresh_token("admin@example.com")
    response = client.post(
        "/refresh",
        json={"refresh_token": refresh_token},
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    decoded = jwt.decode(data["access_token"], JWT_SECRET, algorithms=[JWT_ALGORITHM])
    assert decoded["sub"] == "admin@example.com"
    assert decoded["type"] == "access"


def test_expired_access_token_fails_verification() -> None:
    expired_token = jwt.encode(
        {
            "sub": "admin@example.com",
            "type": "access",
            "iat": datetime.utcnow() - timedelta(minutes=ACCESS_TOKEN_EXPIRES_MINUTES + 10),
            "exp": datetime.utcnow() - timedelta(minutes=5),
        },
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )

    with pytest.raises(jwt.ExpiredSignatureError):
        jwt.decode(expired_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
