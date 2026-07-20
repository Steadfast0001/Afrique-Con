from __future__ import annotations

from app.permissions import is_allowed


def test_permission_matrix_allows_super_admin_any_action() -> None:
    assert is_allowed("super_admin", "anything:goes")


def test_permission_matrix_admin_permissions() -> None:
    assert is_allowed("admin", "branch_routes:read")
    assert is_allowed("admin", "branch_routes:write")
    assert not is_allowed("admin", "booking:create")


def test_permission_matrix_branch_admin_limited() -> None:
    assert is_allowed("branch_admin", "branch:manage")
    assert not is_allowed("branch_admin", "branch_routes:write")


def test_permission_matrix_passenger_permissions() -> None:
    assert is_allowed("passenger", "booking:create")
    assert not is_allowed("passenger", "branch:manage")
