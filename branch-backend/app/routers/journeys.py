from __future__ import annotations

import os
import threading
import time
import uuid
from datetime import datetime, timedelta
from typing import Any

import jwt
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import text

from app.database import SessionLocal, engine
from app.models import JourneySeat

JWT_SECRET = os.environ.get("AUTH_JWT_SECRET", "change-me-in-production")
JWT_ALGORITHM = os.environ.get("AUTH_JWT_ALGORITHM", "HS256")

router = APIRouter()

SEAT_ROWS = list('ABCDEFGHIJ')
SEAT_COLS = [1, 2, 3, 4]
HOLD_TTL_MINUTES = 5
_CLEANUP_THREAD: threading.Thread | None = None
_CLEANUP_STARTED = False


def _generate_taken_matrix(journey_id: str) -> set[str]:
    seed = sum(ord(ch) for ch in journey_id)
    taken_matrix: set[str] = set()
    value = seed
    for row in SEAT_ROWS:
        for col in SEAT_COLS:
            value = (value * 1664525 + 1013904223) & 0xFFFFFFFF
            seat_id = f"{row}{col}"
            if (value / 0x100000000) < 0.22:
                taken_matrix.add(seat_id)
    return taken_matrix


def _seed_journey_seats(session, journey_id: str) -> None:
    existing_rows = session.query(JourneySeat).filter(JourneySeat.journey_id == journey_id).all()
    if len(existing_rows) == len(SEAT_ROWS) * len(SEAT_COLS):
        return

    taken_matrix = _generate_taken_matrix(journey_id)
    existing_ids = {row.seat_id for row in existing_rows}
    for row in SEAT_ROWS:
        for col in SEAT_COLS:
            seat_id = f"{row}{col}"
            if seat_id in existing_ids:
                continue
            status = "taken" if seat_id in taken_matrix else "available"
            session.add(JourneySeat(journey_id=journey_id, seat_id=seat_id, status=status))
    try:
        session.commit()
    except Exception:
        # Another concurrent request already seeded this journey — roll back and continue.
        session.rollback()



def _expire_stale_holds(session, journey_id: str | None = None) -> None:
    now = datetime.utcnow()
    query = session.query(JourneySeat).filter(JourneySeat.status == "held", JourneySeat.expires_at <= now)
    if journey_id is not None:
        query = query.filter(JourneySeat.journey_id == journey_id)
    expired_rows = query.all()
    for row in expired_rows:
        row.status = "available"
        row.booking_ref = None
        row.expires_at = None


def _start_expiry_cleanup() -> None:
    global _CLEANUP_THREAD, _CLEANUP_STARTED
    if _CLEANUP_STARTED:
        return

    def _cleanup_loop() -> None:
        while True:
            time.sleep(30)
            with SessionLocal() as session:
                _expire_stale_holds(session)
                session.commit()

    _CLEANUP_THREAD = threading.Thread(target=_cleanup_loop, daemon=True)
    _CLEANUP_THREAD.start()
    _CLEANUP_STARTED = True


_start_expiry_cleanup()


def _generate_seat_list(journey_id: str) -> list[dict[str, Any]]:
    with SessionLocal() as session:
        _expire_stale_holds(session, journey_id)
        _seed_journey_seats(session, journey_id)

        rows = session.query(JourneySeat).filter(JourneySeat.journey_id == journey_id).order_by(JourneySeat.seat_id).all()
        return [{"id": row.seat_id, "status": row.status} for row in rows]


class JourneyCreate(BaseModel):
    journey_code: str
    origin_location: str
    destination_location: str
    departure_at: datetime


class SeatHoldRequest(BaseModel):
    seat: str


class SeatInventoryResponse(BaseModel):
    journey_id: str
    seats: list[dict[str, str]]


class SeatHoldResponse(BaseModel):
    journey_id: str
    seat: str
    booking_ref: str
    status: str


def decode_jwt_user(request: Request) -> dict[str, Any]:
    auth = request.headers.get("Authorization")
    if not auth:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authorization header")
    scheme, _, token = auth.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authorization header")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return payload


@router.post("/journeys")
def create_journey(payload: JourneyCreate, user: dict = Depends(decode_jwt_user)) -> dict[str, str]:
    # Super admin bypass
    role = user.get("role")
    assigned = (user.get("assigned_branch_code") or "").strip().lower()
    origin = payload.origin_location.strip().lower()

    if role == "super_admin":
        return {"status": "created"}

    if assigned != origin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Cross-branch write forbidden: user assigned to '{assigned}' attempted to create journey with origin '{origin}'",
        )

    return {"status": "created"}


@router.get("/journeys/{journey_id}/seats", response_model=SeatInventoryResponse)
def get_journey_seats(journey_id: str, user: dict = Depends(decode_jwt_user)) -> SeatInventoryResponse:
    seats = _generate_seat_list(journey_id)
    return SeatInventoryResponse(journey_id=journey_id, seats=seats)


@router.post("/journeys/{journey_id}/hold", response_model=SeatHoldResponse)
def hold_journey_seat(journey_id: str, payload: SeatHoldRequest, user: dict = Depends(decode_jwt_user)) -> SeatHoldResponse:
    seat = payload.seat
    booking_ref = f"AC-{uuid.uuid4().hex[:6].upper()}"

    with SessionLocal() as session:
        _expire_stale_holds(session, journey_id)
        _seed_journey_seats(session, journey_id)

        if engine.dialect.name == "sqlite":
            session.execute(text("BEGIN IMMEDIATE"))
            try:
                row = (
                    session.query(JourneySeat)
                    .filter(JourneySeat.journey_id == journey_id, JourneySeat.seat_id == seat)
                    .with_for_update()
                    .one_or_none()
                )
                if row is None:
                    session.rollback()
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid seat")
                if row.status == "taken":
                    session.rollback()
                    raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Seat already taken")
                if row.status == "held":
                    session.rollback()
                    raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Seat already held")

                row.status = "held"
                row.booking_ref = booking_ref
                row.expires_at = datetime.utcnow() + timedelta(minutes=HOLD_TTL_MINUTES)
                session.commit()
            except Exception:
                session.rollback()
                raise
        else:
            with session.begin():
                row = (
                    session.query(JourneySeat)
                    .filter(JourneySeat.journey_id == journey_id, JourneySeat.seat_id == seat)
                    .with_for_update()
                    .one_or_none()
                )
                if row is None:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid seat")
                if row.status == "taken":
                    raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Seat already taken")
                if row.status == "held":
                    raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Seat already held")

                row.status = "held"
                row.booking_ref = booking_ref
                row.expires_at = datetime.utcnow() + timedelta(minutes=HOLD_TTL_MINUTES)

    return SeatHoldResponse(journey_id=journey_id, seat=seat, booking_ref=booking_ref, status="held")
