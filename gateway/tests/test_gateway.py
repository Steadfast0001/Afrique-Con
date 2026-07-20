from __future__ import annotations

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.main import app


def test_health_endpoint() -> None:
    client = TestClient(app)
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_unknown_branch_returns_404() -> None:
    client = TestClient(app)
    response = client.get("/branch/unknown/some/path")

    assert response.status_code == 404
    assert response.json()["detail"] == "Unknown branch: unknown"


@pytest.mark.parametrize(
    "branch,expected_url",
    [
        ("buea", "http://localhost:8000/some/path"),
        ("douala", "http://localhost:8001/some/path"),
    ],
)
def test_branch_route_config(branch: str, expected_url: str, monkeypatch) -> None:
    client = TestClient(app)

    async def fake_request(self, method, url, headers=None, content=None, **kwargs):
        class FakeResponse:
            status_code = 200
            content = b"ok"
            headers = {"content-type": "application/json"}
            elapsed = type("E", (), {"total_seconds": lambda self: 0.01})()

        assert str(url) == expected_url
        return FakeResponse()

    monkeypatch.setattr("app.main.httpx.AsyncClient.request", fake_request)

    response = client.get(f"/branch/{branch}/some/path")
    assert response.status_code == 200
    assert response.content == b"ok"
