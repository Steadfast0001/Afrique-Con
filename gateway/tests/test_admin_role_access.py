from __future__ import annotations

from datetime import datetime, timedelta

import jwt
from fastapi.testclient import TestClient

from app.main import app
from auth import JWT_ALGORITHM, JWT_SECRET


client = TestClient(app)


def make_token(role: str, exp: datetime | None = None) -> str:
    now = datetime.utcnow()
    payload = {
        "sub": "user@example.com",
        "type": "access",
        "role": role,
        "iat": now,
        "exp": exp or (now + timedelta(minutes=15)),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def test_super_admin_role_allows_access() -> None:
    token = make_token("super_admin")
    resp = client.get("/admin/branch-routes", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200


def test_branch_admin_role_denied_on_super_admin_routes() -> None:
    token = make_token("branch_admin")
    resp = client.get("/admin/branch-routes", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403


def test_header_present_but_not_jwt_returns_401() -> None:
    # Simulate the old header-based token still present but not a JWT
    resp = client.get("/admin/branch-routes", headers={"Authorization": "Bearer change-me-super-admin-token"})
    assert resp.status_code == 401


def test_expired_and_malformed_jwt_return_401() -> None:
    expired = make_token("super_admin", exp=datetime.utcnow() - timedelta(minutes=5))
    resp = client.get("/admin/branch-routes", headers={"Authorization": f"Bearer {expired}"})
    assert resp.status_code == 401

    malformed = "not.a.jwt"
    resp2 = client.get("/admin/branch-routes", headers={"Authorization": f"Bearer {malformed}"})
    assert resp2.status_code == 401
