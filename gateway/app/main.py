from __future__ import annotations

import asyncio
import json
import logging
import os
import time
import uuid
from contextlib import asynccontextmanager, suppress
from typing import Any

import httpx
import redis
from fastapi import Depends, FastAPI, Header, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import AnyHttpUrl, BaseModel

from app.config import get_settings
from app.db import (
    create_db_pool,
    fetch_active_branch_routes,
    upsert_branch_route,
)
from auth import require_role
from app.permissions import require_permission

settings = get_settings()

db_pool = None
redis_client: redis.Redis | None = None
# Preload branch route defaults from settings so they are available
# even if the FastAPI startup event isn't executed (e.g., during tests).
branch_routes_cache: dict[str, str] = {k.strip().lower(): v for k, v in settings.branch_routes.items()}

logger = logging.getLogger(settings.service_name)
logging.basicConfig(level=settings.log_level.upper(), format="%(asctime)s %(levelname)s %(name)s %(message)s")


class ProxyResponse(BaseModel):
    status_code: int
    headers: dict[str, str]
    body: Any


class BranchRoutePayload(BaseModel):
    branch_code: str
    backend_url: AnyHttpUrl


class BranchRouteResponse(BaseModel):
    branch_code: str
    backend_url: str
    is_active: bool


class BranchRoutesResponse(BaseModel):
    branch_routes: dict[str, str]


def normalize_branch_code(branch: str) -> str:
    return branch.strip().lower()


def get_trace_id(request: Request) -> str:
    return request.headers.get("X-Trace-Id", str(uuid.uuid4()))


def get_super_admin_user():
    # Deprecated header-based super admin check replaced by JWT role checks.
    # Keep a placeholder for compatibility; admin endpoints now depend on `require_role("super_admin")`.
    raise RuntimeError("use require_role('super_admin') dependency instead")


async def refresh_branch_routes() -> dict[str, str]:
    if not db_pool:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Branch routing database is not configured")

    active_routes = await fetch_active_branch_routes(db_pool)
    normalized = {normalize_branch_code(branch_code): backend_url for branch_code, backend_url in active_routes.items()}
    branch_routes_cache.clear()
    branch_routes_cache.update(normalized)
    logger.info("branch_routes.refreshed", extra={"count": len(branch_routes_cache)})
    return branch_routes_cache


async def initialize_branch_routes() -> None:
    branch_routes_cache.clear()
    branch_routes_cache.update({normalize_branch_code(k): v for k, v in settings.branch_routes.items()})

    if settings.system_branches_database_url:
        try:
            pool = await create_db_pool(settings.system_branches_database_url)
            routes = await fetch_active_branch_routes(pool)
            normalized = {normalize_branch_code(branch_code): backend_url for branch_code, backend_url in routes.items()}
            branch_routes_cache.clear()
            branch_routes_cache.update(normalized)
            global db_pool
            db_pool = pool
            logger.info("branch_routes.loaded_from_system_branches", extra={"count": len(branch_routes_cache)})
        except Exception as exc:
            logger.exception("Failed to load branch routes from system_branches database, using env branch route defaults", exc_info=exc)


def get_redis_client() -> redis.Redis:
    global redis_client
    if redis_client:
        return redis_client
    redis_url = os.environ.get("REDIS_URL") or os.environ.get("REDIS_STAGING_URL")
    if redis_url:
        redis_client = redis.from_url(redis_url, decode_responses=True)
    else:
        host = os.environ.get("REDIS_HOST", "localhost")
        port = int(os.environ.get("REDIS_PORT", "6379"))
        password = os.environ.get("REDIS_PASSWORD")
        redis_client = redis.Redis(host=host, port=port, password=password, decode_responses=True)
    return redis_client


DEFAULT_SEARCH_TTL = int(os.environ.get("SEARCH_INDEX_TTL_SECONDS", "3600"))


def make_search_key(origin: str, destination: str, date: str) -> str:
    o = (origin or "").strip().lower()
    d = (destination or "").strip().lower()
    dt = (date or "").strip()
    return f"search:index:{o}:{d}:{dt}"


def cache_search_results(key: str, data: dict, ttl: int = DEFAULT_SEARCH_TTL) -> None:
    client = get_redis_client()
    try:
        client.set(key, json.dumps(data), ex=ttl)
    except Exception:
        logger.exception("Failed to write search cache", exc_info=True)


def get_cached_search(key: str) -> dict | None:
    try:
        client = get_redis_client()
        val = client.get(key)
        if not val:
            return None
        return json.loads(val)
    except Exception:
        logger.exception("Failed to read search cache", exc_info=True)
        return None


def invalidate_search_cache_for_journey(journey_id: str) -> int:
    client = get_redis_client()
    deleted = 0
    try:
        for key in client.scan_iter(match="search:index:*"):
            try:
                val = client.get(key)
                if not val:
                    continue
                payload = json.loads(val)
                # payload expected to contain a list of journeys under 'results'
                for j in payload.get("results", []):
                    if str(j.get("journey_id")) == str(journey_id):
                        client.delete(key)
                        deleted += 1
                        break
            except Exception:
                continue
    except Exception:
        logger.exception("Failed to invalidate search cache", exc_info=True)
    return deleted


async def background_refresh_near_term_jobs():
    """Periodically extends TTL for near-term journeys to avoid sudden staleness.

    This is a lightweight approach for development/staging: it touches keys whose
    results include journeys departing within the next 48 hours and resets their TTL.
    """
    client = get_redis_client()
    import datetime

    while True:
        try:
            await refresh_near_term_jobs_once()
        except Exception:
            logger.exception("Error in background refresh task", exc_info=True)
        await asyncio.sleep(60)


async def refresh_near_term_jobs_once() -> int:
    """Perform a single pass of near-term job TTL refresh. Returns number of keys touched."""
    client = get_redis_client()
    import datetime

    touched = 0
    now = datetime.datetime.utcnow()
    cutoff = now + datetime.timedelta(hours=48)
    for key in client.scan_iter(match="search:index:*"):
        try:
            val = client.get(key)
            if not val:
                continue
            payload = json.loads(val)
            for j in payload.get("results", []):
                dep = j.get("departure_at")
                if not dep:
                    continue
                try:
                    dep_dt = datetime.datetime.fromisoformat(dep)
                except Exception:
                    continue
                if now <= dep_dt <= cutoff:
                    if client.expire(key, DEFAULT_SEARCH_TTL):
                        touched += 1
                    break
        except Exception:
            continue
    return touched


@asynccontextmanager
async def lifespan(app: FastAPI):
    await initialize_branch_routes()
    # Start the background refresh task only when Redis is reachable.
    refresh_task = None
    try:
        client = get_redis_client()
        client.ping()
        refresh_task = asyncio.create_task(background_refresh_near_term_jobs())
    except Exception:
        logger.warning("Redis not available; background refresh disabled")
    try:
        yield
    finally:
        if refresh_task is not None:
            refresh_task.cancel()
            with suppress(Exception):
                await refresh_task
        if db_pool:
            await db_pool.close()

from auth import app as auth_app

app = FastAPI(title="Afrique-Con API Gateway", lifespan=lifespan)
app.mount("/gateway", auth_app)



async def proxy_request(request: Request, branch: str, path: str, trace_id: str) -> Response:
    normalized_branch = normalize_branch_code(branch)

    # Prefer the in-memory cache, but fall back to configured defaults
    backend = branch_routes_cache.get(normalized_branch)
    if not backend:
        defaults = {k.strip().lower(): v for k, v in settings.branch_routes.items()}
        backend = defaults.get(normalized_branch)

    if not backend:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Unknown branch: {branch}")

    destination = backend.rstrip("/")
    url = httpx.URL(destination).join(f"/{path}")
    if request.url.query:
        url = url.copy_with(query=request.url.query)

    headers = {k: v for k, v in request.headers.items() if k.lower() != "host"}
    headers["X-Forwarded-For"] = request.client.host if request.client else "unknown"
    headers["X-Trace-Id"] = trace_id
    headers["Via"] = "Afrique-Con-Gateway"

    body = await request.body()

    logger.info("proxy_request.start", extra={
        "trace_id": trace_id,
        "branch": branch,
        "destination": str(url),
        "method": request.method,
    })

    async with httpx.AsyncClient(timeout=30.0, follow_redirects=False) as client:
        response = await client.request(
            request.method,
            str(url),
            headers=headers,
            content=body,
        )

    logger.info("proxy_request.complete", extra={
        "trace_id": trace_id,
        "branch": branch,
        "status_code": response.status_code,
        "duration_ms": int(response.elapsed.total_seconds() * 1000),
    })

    return Response(
        content=response.content,
        status_code=response.status_code,
        headers={k: v for k, v in response.headers.items() if k.lower() not in ["content-encoding", "transfer-encoding", "connection"]},
    )


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    trace_id = get_trace_id(request)
    start_time = time.time()
    logger.info("request.start", extra={
        "trace_id": trace_id,
        "method": request.method,
        "path": request.url.path,
        "query": str(request.url.query),
        "client": request.client.host if request.client else None,
    })

    response = await call_next(request)

    duration_ms = int((time.time() - start_time) * 1000)
    logger.info("request.complete", extra={
        "trace_id": trace_id,
        "status_code": response.status_code,
        "duration_ms": duration_ms,
    })
    return response


@app.middleware("http")
async def branch_key_middleware(request: Request, call_next):
    """If `X-Branch-Key` header is present, route the request to the
    corresponding branch node using the existing proxy logic.

    Admin and health endpoints are excluded from header-based routing.
    Unknown or inactive branch codes return HTTP 404.
    """
    branch_key = request.headers.get("X-Branch-Key")
    if not branch_key:
        return await call_next(request)

    # Do not intercept admin/health endpoints
    if request.url.path.startswith("/admin") or request.url.path.startswith("/health"):
        return await call_next(request)

    normalized = normalize_branch_code(branch_key)
    backend = branch_routes_cache.get(normalized)
    if not backend:
        defaults = {k.strip().lower(): v for k, v in settings.branch_routes.items()}
        backend = defaults.get(normalized)
    if not backend:
        return JSONResponse({"detail": f"Unknown branch: {branch_key}"}, status_code=status.HTTP_404_NOT_FOUND)

    # Forward the entire request path and query to the branch node
    path_to_forward = request.url.path.lstrip("/")
    trace_id = get_trace_id(request)
    return await proxy_request(request, normalized, path_to_forward, trace_id)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/admin/branch-routes", response_model=BranchRouteResponse)
async def register_branch_route(
    payload: BranchRoutePayload,
    authorized: dict = Depends(require_role("super_admin")),
) -> BranchRouteResponse:
    if not db_pool:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Branch routing database is not configured")

    record = await upsert_branch_route(db_pool, payload.branch_code, str(payload.backend_url))
    normalized_branch = normalize_branch_code(record["branch_code"])
    branch_routes_cache[normalized_branch] = record["backend_url"]
    return BranchRouteResponse(**record)


@app.post("/admin/branch-routes/refresh", response_model=BranchRoutesResponse)
async def refresh_branch_routes_endpoint(
    authorized: dict = Depends(require_role("super_admin")),
) -> BranchRoutesResponse:
    routes = await refresh_branch_routes()
    return BranchRoutesResponse(branch_routes=routes)


@app.get("/admin/branch-routes", response_model=BranchRoutesResponse)
async def list_branch_routes(
    authorized: dict = Depends(require_role("super_admin")),
) -> BranchRoutesResponse:
    return BranchRoutesResponse(branch_routes=branch_routes_cache)


@app.api_route("/branch/{branch}/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def branch_proxy(
    request: Request,
    branch: str,
    path: str,
    trace_id: str = Depends(get_trace_id),
    x_trace_id: str | None = Header(None, alias="X-Trace-Id"),
) -> Response:
    return await proxy_request(request, branch, path, trace_id if trace_id else x_trace_id or str(uuid.uuid4()))


class JourneyCreate(BaseModel):
    journey_code: str
    origin_location: str
    destination_location: str
    departure_at: str


class BookingRequest(BaseModel):
    journey_id: str
    seat: str
    passenger_name: str | None = None
    amount: int | None = None


class BookingResponse(BaseModel):
    booking_ref: str
    journey_id: str
    seat: str
    passenger_name: str | None
    amount: int
    status: str


@app.post("/api/journeys/schedule")
async def schedule_journey(
    request: Request,
    payload: JourneyCreate,
    user: dict = Depends(require_permission("branch:manage")),
    trace_id: str = Depends(get_trace_id),
) -> Response:
    # Boundary check: user's assigned branch must match origin_location unless super_admin
    role = user.get("role")
    assigned = (user.get("assigned_branch_code") or "").strip().lower()
    origin = payload.origin_location.strip().lower()

    if role != "super_admin" and assigned != origin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Cross-branch write forbidden: user assigned to '{assigned}' attempted to schedule journey with origin '{origin}'",
        )

    # Lookup backend for origin branch
    backend = branch_routes_cache.get(origin)
    if not backend:
        defaults = {k.strip().lower(): v for k, v in settings.branch_routes.items()}
        backend = defaults.get(origin)
    if not backend:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Unknown branch: {origin}")

    destination = backend.rstrip("/") + "/local-schedule"

    # Forward identity headers to branch node so it can validate or log the request
    headers: dict[str, str] = {}
    # include trace id
    headers["X-Trace-Id"] = trace_id
    # forward authorization if present on original request
    auth_header = request.headers.get("Authorization")
    if auth_header:
        headers["Authorization"] = auth_header

    # Prepare JSON payload
    json_payload = payload.model_dump()

    # Retry logic with exponential backoff
    attempts = 3
    delay = 0.1
    last_exc = None
    async with httpx.AsyncClient(timeout=10.0) as client:
        for attempt in range(attempts):
            try:
                resp = await client.post(destination, json=json_payload, headers=headers)
                if resp.status_code < 500:
                    return Response(content=resp.content, status_code=resp.status_code, headers={k: v for k, v in resp.headers.items()})
                last_exc = Exception(f"upstream returned {resp.status_code}")
            except Exception as exc:
                last_exc = exc
            if attempt < attempts - 1:
                await asyncio.sleep(delay)
                delay *= 2

    # If we reach here, the attempts failed
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Branch node scheduling failed after retries")


@app.post("/api/book", response_model=BookingResponse)
async def book_journey(payload: BookingRequest, request: Request, trace_id: str = Depends(get_trace_id)):
    """Mock booking endpoint for frontend development and E2E tests.

    Returns a deterministic booking reference and echoes back the selection.
    """
    # create a short booking reference
    short = uuid.uuid4().hex[:6].upper()
    booking_ref = f"AC-{short}"
    amount = int(payload.amount) if payload.amount else 5000

    logger.info("booking.created", extra={"trace_id": trace_id, "booking_ref": booking_ref, "journey_id": payload.journey_id})
    # Invalidate any cached search results that reference this journey
    try:
        invalidated = invalidate_search_cache_for_journey(payload.journey_id)
        logger.info("search_cache.invalidated", extra={"trace_id": trace_id, "journey_id": payload.journey_id, "keys_deleted": invalidated})
    except Exception:
        logger.exception("Failed to invalidate search cache after booking", exc_info=True)

    body = {
        "booking_ref": booking_ref,
        "journey_id": payload.journey_id,
        "seat": payload.seat,
        "passenger_name": payload.passenger_name or "John Doe",
        "amount": amount,
        "status": "confirmed",
    }
    return JSONResponse(content=body, status_code=200)



@app.get("/api/search")
async def search_endpoint(request: Request) -> Response:
    """Simple search endpoint with Redis-backed cache and TTL for development/testing.

    Query params: origin, destination, date
    """
    origin = request.query_params.get("origin", "")
    destination = request.query_params.get("destination", "")
    date = request.query_params.get("date", "")

    key = make_search_key(origin, destination, date)
    cached = get_cached_search(key)
    if cached:
        logger.info("search.cache.hit", extra={"key": key})
        return JSONResponse(content=cached, status_code=200)

    # Build deterministic mock search results for frontend and E2E tests
    results = []
    from datetime import datetime, timedelta

    base_dt = None
    try:
        base_dt = datetime.fromisoformat(date)
    except Exception:
        base_dt = datetime.utcnow()

    for i in range(3):
        dep = base_dt + timedelta(hours=2 * i)
        journey_id = f"{origin}-{destination}-{date}-{i}"
        results.append({
            "journey_id": journey_id,
            "journey_code": f"JNY-{i+1:03d}",
            "origin": origin,
            "destination": destination,
            "departure_at": dep.isoformat(),
            "price": 10000 + i * 2500,
            "seats_left": max(0, 10 - i * 3),
        })

    payload = {"results": results}
    cache_search_results(key, payload)
    logger.info("search.cache.miss.stored", extra={"key": key, "ttl": DEFAULT_SEARCH_TTL})
    return JSONResponse(content=payload, status_code=200)
