from __future__ import annotations

from typing import Any

from fastapi import Depends, HTTPException, status

from auth import get_current_user

# Simple permission matrix mapping roles to allowed action patterns.
# Use '*' to allow any action for a role.
PERMISSIONS: dict[str, list[str]] = {
    "super_admin": ["*"],
    "admin": ["branch_routes:read", "branch_routes:write", "branch:manage"],
    "branch_admin": ["branch:manage"],
    "passenger": ["booking:create", "booking:read"],
}


def is_allowed(role: str | None, action: str) -> bool:
    if not role:
        return False
    patterns = PERMISSIONS.get(role, [])
    if "*" in patterns:
        return True
    # direct match
    if action in patterns:
        return True
    # simple prefix wildcard support: pattern like "branch_routes:*"
    for p in patterns:
        if p.endswith(":*"):
            prefix = p[:-2]
            if action.startswith(prefix + ":"):
                return True
    return False


def require_permission(action: str):
    def _dep(user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
        role = user.get("role")
        if not is_allowed(role, action):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user

    return _dep
