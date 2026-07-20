from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import Column, DateTime, Integer, String, UniqueConstraint
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class JourneySeat(Base):
    __tablename__ = "journey_seats"

    id = Column(Integer, primary_key=True, index=True)
    journey_id = Column(String(length=64), nullable=False, index=True)
    seat_id = Column(String(length=4), nullable=False)
    status = Column(String(length=16), nullable=False, default="available")
    booking_ref = Column(String(length=32), nullable=True)
    created_at = Column(DateTime(timezone=False), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=False), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    expires_at = Column(DateTime(timezone=False), nullable=True)

    __table_args__ = (UniqueConstraint("journey_id", "seat_id", name="uq_journey_seat"),)
