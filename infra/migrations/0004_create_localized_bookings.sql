-- Migration: Create localized_bookings table with FK to localized_journeys and unique momo_reference_id

CREATE TABLE IF NOT EXISTS public.localized_bookings (
    id BIGSERIAL PRIMARY KEY,
    journey_id BIGINT NOT NULL REFERENCES public.localized_journeys(id) ON DELETE CASCADE,
    booking_code TEXT NOT NULL UNIQUE,
    momo_reference_id TEXT UNIQUE,
    passenger_name TEXT,
    phone TEXT,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'XAF',
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (amount >= 0)
);
