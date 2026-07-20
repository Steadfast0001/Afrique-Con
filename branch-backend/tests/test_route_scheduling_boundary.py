from __future__ import annotations

from datetime import datetime, timedelta

import jwt
from fastapi.testclient import TestClient

from app.main import app
import os
JWT_SECRET = os.environ.get("AUTH_JWT_SECRET", "change-me-in-production")
JWT_ALGORITHM = os.environ.get("AUTH_JWT_ALGORITHM", "HS256")

client = TestClient(app)


def make_token(role: str, assigned_branch: str) -> str:
    now = datetime.utcnow()
    payload = {
        "sub": "user@example.com",
        "type": "access",
        "role": role,
        "assigned_branch_code": assigned_branch,
        "iat": now,
        "exp": now + timedelta(minutes=15),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def test_allowed_same_branch() -> None:
    token = make_token("branch_admin", "BUEA")
    resp = client.post(
        "/journeys",
        json={
            "journey_code": "BUEA-J100",
            "origin_location": "BUEA",
            "destination_location": "DOUALA",
            "departure_at": datetime.utcnow().isoformat(),
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200


def test_denied_cross_branch() -> None:
    token = make_token("branch_admin", "BUEA")
    resp = client.post(
        "/journeys",
        json={
            "journey_code": "DOU-J200",
            "origin_location": "DOUALA",
            "destination_location": "BUEA",
            "departure_at": datetime.utcnow().isoformat(),
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 403
    assert "Cross-branch write forbidden" in resp.json()["detail"]


def test_super_admin_bypass() -> None:
    token = make_token("super_admin", "BUEA")
    resp = client.post(
        "/journeys",
        json={
            "journey_code": "DOU-J999",
            "origin_location": "DOUALA",
            "destination_location": "BUEA",
            "departure_at": datetime.utcnow().isoformat(),
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
