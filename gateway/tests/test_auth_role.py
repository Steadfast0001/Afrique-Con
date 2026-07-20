from __future__ import annotations

import jwt
from fastapi.testclient import TestClient

from auth import JWT_ALGORITHM, JWT_SECRET, app, create_access_token, create_refresh_token

client = TestClient(app)


def test_whoami_and_role_in_token() -> None:
    # Create a token with role and assigned_branch_code by encoding manually
    payload = {"sub": "user@example.com", "type": "access", "role": "passenger", "assigned_branch_code": "buea"}
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    response = client.get("/whoami", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "user@example.com"
    assert data["role"] == "passenger"
    assert data["assigned_branch_code"] == "buea"


def test_admin_only_endpoint_allows_admin_and_denies_operator() -> None:
    admin_payload = {"sub": "admin@example.com", "type": "access", "role": "admin"}
    admin_token = jwt.encode(admin_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    resp = client.get("/admin-only", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200

    operator_payload = {"sub": "op@example.com", "type": "access", "role": "operator"}
    op_token = jwt.encode(operator_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    resp2 = client.get("/admin-only", headers={"Authorization": f"Bearer {op_token}"})
    assert resp2.status_code == 403
