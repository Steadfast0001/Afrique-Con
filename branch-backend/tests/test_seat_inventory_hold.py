from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
import os

import jwt
import pytest
from fastapi.testclient import TestClient

from app.database import SessionLocal, engine
from app.main import app
from app.models import Base, JourneySeat

JWT_SECRET = os.environ.get("AUTH_JWT_SECRET", "change-me-in-production")
JWT_ALGORITHM = os.environ.get("AUTH_JWT_ALGORITHM", "HS256")

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_db() -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


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


def test_seat_inventory_returns_seats() -> None:
    token = make_token("branch_admin", "BUEA")
    journey_id = "BUEA-DOU-2026-07-10"
    resp = client.get(f"/journeys/{journey_id}/seats", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["journey_id"] == journey_id
    assert isinstance(data["seats"], list)
    assert len(data["seats"]) == 40
    assert all(seat["id"] for seat in data["seats"])


def test_hold_available_seat_then_conflict_on_repeat() -> None:
    token = make_token("branch_admin", "BUEA")
    journey_id = "BUEA-DOU-2026-07-10"
    inventory_resp = client.get(f"/journeys/{journey_id}/seats", headers={"Authorization": f"Bearer {token}"})
    assert inventory_resp.status_code == 200
    seats = inventory_resp.json()["seats"]
    available = next((seat for seat in seats if seat["status"] == "available"), None)
    assert available is not None, "Expected at least one available seat"

    hold_resp = client.post(
        f"/journeys/{journey_id}/hold",
        json={"seat": available["id"]},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert hold_resp.status_code == 200
    assert hold_resp.json()["seat"] == available["id"]
    assert hold_resp.json()["status"] == "held"

    conflict_resp = client.post(
        f"/journeys/{journey_id}/hold",
        json={"seat": available["id"]},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert conflict_resp.status_code == 409
    assert "already" in conflict_resp.json()["detail"].lower()


def test_hold_invalid_seat_returns_bad_request() -> None:
    token = make_token("branch_admin", "BUEA")
    journey_id = "BUEA-DOU-2026-07-10"
    resp = client.post(
        f"/journeys/{journey_id}/hold",
        json={"seat": "Z9"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 400


def test_concurrent_holds_only_one_succeeds_for_same_seat() -> None:
    token = make_token("branch_admin", "BUEA")
    journey_id = "BUEA-DOU-2026-07-10"

    def attempt_hold() -> int:
        with TestClient(app) as local_client:
            resp = local_client.post(
                f"/journeys/{journey_id}/hold",
                json={"seat": "A1"},
                headers={"Authorization": f"Bearer {token}"},
            )
            return resp.status_code

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(lambda _: attempt_hold(), range(2)))

    assert results.count(200) == 1
    assert results.count(409) == 1

    with SessionLocal() as session:
        seated = session.query(JourneySeat).filter_by(journey_id=journey_id, seat_id="A1").one()
        assert seated.status == "held"

def test_confirm_held_seat() -> None:
    token = make_token("branch_admin", "BUEA")
    journey_id = "BUEA-DOU-2026-07-10"
    
    # First hold a seat
    inventory_resp = client.get(f"/journeys/{journey_id}/seats", headers={"Authorization": f"Bearer {token}"})
    seats = inventory_resp.json()["seats"]
    available = next((seat for seat in seats if seat["status"] == "available"), None)
    assert available is not None

    hold_resp = client.post(
        f"/journeys/{journey_id}/hold",
        json={"seat": available["id"]},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert hold_resp.status_code == 200
    booking_ref = hold_resp.json()["booking_ref"]
    
    # Then confirm it
    confirm_resp = client.post(
        f"/journeys/{journey_id}/confirm",
        json={"seat": available["id"], "booking_ref": booking_ref},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert confirm_resp.status_code == 200
    assert confirm_resp.json()["status"] == "taken"

def test_confirm_seat_invalid_ref() -> None:
    token = make_token("branch_admin", "BUEA")
    journey_id = "BUEA-DOU-2026-07-10"
    
    # First hold a seat
    inventory_resp = client.get(f"/journeys/{journey_id}/seats", headers={"Authorization": f"Bearer {token}"})
    seats = inventory_resp.json()["seats"]
    available = next((seat for seat in seats if seat["status"] == "available"), None)
    
    hold_resp = client.post(
        f"/journeys/{journey_id}/hold",
        json={"seat": available["id"]},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert hold_resp.status_code == 200
    
    # Try to confirm with invalid ref
    confirm_resp = client.post(
        f"/journeys/{journey_id}/confirm",
        json={"seat": available["id"], "booking_ref": "INVALID-REF"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert confirm_resp.status_code == 400
    assert "Invalid booking reference" in confirm_resp.json()["detail"]
