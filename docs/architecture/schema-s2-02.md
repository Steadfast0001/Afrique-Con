# Schema Definition S2-02: global_users

`global_users`

- `id` BIGSERIAL PRIMARY KEY
- `email` TEXT NOT NULL UNIQUE
- `display_name` TEXT
- `role` public.global_user_role NOT NULL
- `is_active` BOOLEAN NOT NULL DEFAULT true
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT now()
