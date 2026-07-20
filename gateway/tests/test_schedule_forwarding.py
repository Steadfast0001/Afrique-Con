from __future__ import annotations

from datetime import datetime, timedelta

import jwt
from fastapi.testclient import TestClient

from app.main import app
from auth import JWT_ALGORITHM, JWT_SECRET

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


async def fake_post_inspect(self, url, json=None, headers=None, **kwargs):
    # Assert that Authorization header was forwarded
    assert headers is not None
    assert "Authorization" in headers
    token = headers["Authorization"].split(" ", 1)[1]
    decoded = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    # The branch node should receive the original token; it should contain assigned_branch_code
    assert decoded.get("assigned_branch_code") == "BUEA"

    class FakeResp:
        status_code = 200
        content = b"{\"status\": \"scheduled\", \"received_identity\": true}"
        headers = {"content-type": "application/json"}

    return FakeResp()


def test_forwarded_authorization_and_identity(monkeypatch) -> None:
    token = make_token("branch_admin", "BUEA")
    monkeypatch.setattr("app.main.httpx.AsyncClient.post", fake_post_inspect)

    resp = client.post(
        "/api/journeys/schedule",
        json={
            "journey_code": "BUEA-J200",
            "origin_location": "BUEA",
            "destination_location": "DOUALA",
            "departure_at": datetime.utcnow().isoformat(),
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 200
    assert resp.json().get("received_identity") is True
