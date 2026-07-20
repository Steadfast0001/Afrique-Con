-- Migration: Create global_users table with role enum constraint
-- This migration creates the global users table and the role enum type.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'global_user_role') THEN
        CREATE TYPE public.global_user_role AS ENUM (
            'admin',
            'operator',
            'manager',
            'auditor',
            'support',
            'subscriber'
        );
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.global_users (
    id BIGSERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT,
    password_hash TEXT NOT NULL,
    assigned_branch_code TEXT,
    role public.global_user_role NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed standard accounts for testing
INSERT INTO public.global_users (email, display_name, password_hash, assigned_branch_code, role, is_active)
VALUES
    ('admin@example.com', 'System Admin', '$2b$12$iv4cduf/jK/vq/81epqO2Otvb22snOzIE3ji5j9Cej/isyEJ9dTvi', 'BUEA-01', 'admin', true),
    ('subscriber@example.com', 'Operator Subscriber', '$2b$12$Dh8zG78ApiyLNwQfrciaZugTVLXhepC0IAym2ilAvuoq1MEKnwB.a', 'DOUALA-01', 'subscriber', true)
ON CONFLICT (email) DO UPDATE
SET display_name = EXCLUDED.display_name,
    password_hash = EXCLUDED.password_hash,
    assigned_branch_code = EXCLUDED.assigned_branch_code,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;
