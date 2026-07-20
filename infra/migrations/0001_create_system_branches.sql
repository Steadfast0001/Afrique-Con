-- Migration: Create system_branches table
-- This migration creates the table used to store branch terminal mappings.

CREATE TABLE IF NOT EXISTS public.system_branches (
    id BIGSERIAL PRIMARY KEY,
    terminal_code VARCHAR(64) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT false,
    onboarded_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed the known terminal codes as inactive until onboarded.
INSERT INTO public.system_branches (terminal_code, is_active)
VALUES
    ('BUEA-01', false),
    ('DOUALA-01', false),
    ('DOUALA-02', false),
    ('YAOUNDE-01', false),
    ('IKOM-01', false)
ON CONFLICT (terminal_code) DO NOTHING;
