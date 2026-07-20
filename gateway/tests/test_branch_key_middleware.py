from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_branch_key_forwarding(monkeypatch) -> None:
    async def fake_request(self, method, url, headers=None, content=None, **kwargs):
        class FakeResponse:
            status_code = 200
            content = b"ok"
            headers = {"content-type": "application/json"}
            elapsed = type("E", (), {"total_seconds": lambda self: 0.01})()

        assert str(url) == "http://localhost:8000/some/path"
        return FakeResponse()

    monkeypatch.setattr("app.main.httpx.AsyncClient.request", fake_request)

    response = client.get("/some/path", headers={"X-Branch-Key": "buea"})
    assert response.status_code == 200
    assert response.content == b"ok"


def test_branch_key_unknown_branch_returns_404() -> None:
    response = client.get("/some/path", headers={"X-Branch-Key": "unknown-branch"})
    assert response.status_code == 404
    assert response.json()["detail"].startswith("Unknown branch")
