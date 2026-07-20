from __future__ import annotations

from typing import Any

import asyncpg


async def create_db_pool(dsn: str) -> asyncpg.Pool:
    return await asyncpg.create_pool(dsn)


async def fetch_active_branch_routes(pool: asyncpg.Pool) -> dict[str, str]:
    async with pool.acquire() as connection:
        rows = await connection.fetch(
            """
            SELECT terminal_code, backend_url
            FROM public.system_branches
            WHERE is_active = true
              AND backend_url IS NOT NULL
            """
        )

    return {row["terminal_code"]: row["backend_url"] for row in rows if row["backend_url"]}


async def upsert_branch_route(pool: asyncpg.Pool, branch_code: str, backend_url: str) -> dict[str, Any]:
    async with pool.acquire() as connection:
        row = await connection.fetchrow(
            """
            INSERT INTO public.system_branches (terminal_code, backend_url, is_active, onboarded_at, updated_at)
            VALUES ($1, $2, true, now(), now())
            ON CONFLICT (terminal_code) DO UPDATE
            SET backend_url = EXCLUDED.backend_url,
                is_active = true,
                updated_at = now()
            RETURNING terminal_code, backend_url, is_active
            """,
            branch_code,
            backend_url,
        )

    return dict(row)
