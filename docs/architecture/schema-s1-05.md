# Schema Definition S1-05: system_branches

`system_branches`

- `terminal_code` TEXT PRIMARY KEY
- `is_active` BOOLEAN NOT NULL DEFAULT false
- `onboarded_at` TIMESTAMPTZ NULL
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT now()
