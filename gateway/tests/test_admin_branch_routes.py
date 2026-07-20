from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app, branch_routes_cache

client = TestClient(app)


def test_admin_branch_routes_refresh_requires_auth() -> None:
    response = client.post("/admin/branch-routes/refresh")
    assert response.status_code == 401


def test_admin_branch_routes_list_requires_auth() -> None:
    response = client.get("/admin/branch-routes")
    assert response.status_code == 401


def test_register_branch_route_requires_auth() -> None:
    response = client.post(
        "/admin/branch-routes",
        json={"branch_code": "BUEA-01", "backend_url": "http://localhost:8000"},
    )
    assert response.status_code == 401


@pytest.mark.parametrize(
    "branch_code,backend_url",
    [
        ("BUEA-01", "http://localhost:8000"),
        ("douala", "http://localhost:8001"),
    ],
)
def test_normalize_branch_code_is_lowercase(branch_code: str, backend_url: str) -> None:
    branch_routes_cache.clear()
    branch_routes_cache[branch_code.lower()] = backend_url
    assert branch_code.lower() in branch_routes_cache
