-- Migration: Create localized_journeys table with branch-specific origin_location enforcement.
-- Usage: psql -v branch_origin='BUEA' -f 0003_create_localized_journeys.sql

CREATE TABLE IF NOT EXISTS public.localized_journeys (
    id BIGSERIAL PRIMARY KEY,
    journey_code TEXT NOT NULL UNIQUE,
    origin_location TEXT NOT NULL,
    destination_location TEXT NOT NULL,
    departure_at TIMESTAMPTZ NOT NULL,
    arrival_at TIMESTAMPTZ NOT NULL,
    localized_description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (origin_location = :'branch_origin'),
    CHECK (departure_at < arrival_at)
);
