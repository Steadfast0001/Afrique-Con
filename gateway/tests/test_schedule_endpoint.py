from __future__ import annotations

from datetime import datetime, timedelta

import jwt
import asyncio
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


async def fake_post_success(self, url, json=None, headers=None, **kwargs):
    class FakeResp:
        status_code = 200
        content = b"{\"status\": \"scheduled\"}"
        headers = {"content-type": "application/json"}
    return FakeResp()


async def fake_post_server_error(self, url, json=None, headers=None, **kwargs):
    class FakeResp:
        status_code = 500
        content = b"error"
        headers = {"content-type": "text/plain"}
    return FakeResp()


def test_schedule_proxies_success(monkeypatch) -> None:
    token = make_token("branch_admin", "BUEA")
    monkeypatch.setattr("app.main.httpx.AsyncClient.post", fake_post_success)

    resp = client.post(
        "/api/journeys/schedule",
        json={
            "journey_code": "BUEA-J123",
            "origin_location": "BUEA",
            "destination_location": "DOUALA",
            "departure_at": datetime.utcnow().isoformat(),
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "scheduled"


def test_schedule_retries_and_fails(monkeypatch) -> None:
    token = make_token("branch_admin", "BUEA")
    # First two attempts server error, third attempt raises exception
    calls = {"n": 0}

    async def fake_post_sequence(self, url, json=None, headers=None, **kwargs):
        calls["n"] += 1
        if calls["n"] < 3:
            return await fake_post_server_error(self, url, json=json, headers=headers)
        raise Exception("connect error")

    monkeypatch.setattr("app.main.httpx.AsyncClient.post", fake_post_sequence)

    resp = client.post(
        "/api/journeys/schedule",
        json={
            "journey_code": "BUEA-J124",
            "origin_location": "BUEA",
            "destination_location": "DOUALA",
            "departure_at": datetime.utcnow().isoformat(),
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 500


def test_boundary_blocks_cross_branch(monkeypatch) -> None:
    token = make_token("branch_admin", "BUEA")
    monkeypatch.setattr("app.main.httpx.AsyncClient.post", fake_post_success)

    resp = client.post(
        "/api/journeys/schedule",
        json={
            "journey_code": "DOU-J200",
            "origin_location": "DOUALA",
            "destination_location": "BUEA",
            "departure_at": datetime.utcnow().isoformat(),
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 403


def test_super_admin_bypass(monkeypatch) -> None:
    token = make_token("super_admin", "BUEA")
    monkeypatch.setattr("app.main.httpx.AsyncClient.post", fake_post_success)

    resp = client.post(
        "/api/journeys/schedule",
        json={
            "journey_code": "DOU-J999",
            "origin_location": "DOUALA",
            "destination_location": "BUEA",
            "departure_at": datetime.utcnow().isoformat(),
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
