from __future__ import annotations

import os
from datetime import datetime, timedelta
from typing import Any

import bcrypt
import jwt
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, Field, EmailStr


import asyncpg

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = Field(default="bearer")


class LoginResponse(BaseModel):
    email: EmailStr
    token: TokenResponse


class RefreshResponse(BaseModel):
    access_token: str
    token_type: str = Field(default="bearer")


class UserInDB(BaseModel):
    email: EmailStr
    hashed_password: str
    is_active: bool = True
    role: str = "operator"
    assigned_branch_code: str | None = None


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/gateway/login")

app = FastAPI(title="Afrique-Con Auth")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

JWT_SECRET = os.environ.get(
    "AUTH_JWT_SECRET",
    "change-me-in-production-please-use-a-strong-secret-32chars-or-longer",
)
JWT_ALGORITHM = os.environ.get("AUTH_JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRES_MINUTES = int(os.environ.get("AUTH_ACCESS_TOKEN_EXPIRES_MINUTES", "15"))
REFRESH_TOKEN_EXPIRES_DAYS = int(os.environ.get("AUTH_REFRESH_TOKEN_EXPIRES_DAYS", "7"))


db_pool: asyncpg.Pool | None = None


async def get_db_pool() -> asyncpg.Pool | None:
    global db_pool
    if db_pool:
        return db_pool
    dsn = os.environ.get("SYSTEM_BRANCHES_DATABASE_URL") or os.environ.get("DATABASE_URL")
    if not dsn:
        return None
    db_pool = await asyncpg.create_pool(dsn)
    return db_pool


def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def create_jwt_token(subject: str, expires_delta: timedelta, token_type: str, role: str = "operator", assigned_branch_code: str | None = None) -> str:
    now = datetime.utcnow()
    payload: dict[str, Any] = {
        "sub": subject,
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
        "role": role,
    }
    if assigned_branch_code:
        payload["assigned_branch_code"] = assigned_branch_code
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_access_token(subject: str, role: str = "operator", assigned_branch_code: str | None = None) -> str:
    return create_jwt_token(subject, timedelta(minutes=ACCESS_TOKEN_EXPIRES_MINUTES), "access", role, assigned_branch_code)


def create_refresh_token(subject: str) -> str:
    return create_jwt_token(subject, timedelta(days=REFRESH_TOKEN_EXPIRES_DAYS), "refresh")


def decode_jwt_token(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired") from exc
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc


def get_current_user(token: str = Depends(oauth2_scheme)) -> dict[str, Any]:
    payload = decode_jwt_token(token)
    # Only accept access tokens for user context
    if payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token subject")

    return {
        "email": email,
        "role": payload.get("role"),
        "assigned_branch_code": payload.get("assigned_branch_code"),
    }


def require_role(*allowed_roles: str):
    def _dependency(user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
        role = user.get("role")
        if role not in allowed_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")
        return user

    return _dependency


@app.get("/whoami")
def whoami(user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    return user


@app.get("/admin-only")
def admin_only(user: dict[str, Any] = Depends(require_role("admin"))) -> dict[str, str]:
    return {"status": "ok"}


async def get_user_by_email(email: str) -> UserInDB | None:
    # Fallback to mock lookup if no database is connected
    dsn = os.environ.get("SYSTEM_BRANCHES_DATABASE_URL") or os.environ.get("DATABASE_URL")
    if not dsn:
        if email == "admin@example.com":
            return UserInDB(
                email=email,
                hashed_password=get_password_hash("secret123"),
                is_active=True,
                role="admin",
                assigned_branch_code="BUEA-01",
            )
        if email == "subscriber@example.com":
            return UserInDB(
                email=email,
                hashed_password=get_password_hash("subscriber123"),
                is_active=True,
                role="subscriber",
                assigned_branch_code="DOUALA-01",
            )
        return None

    try:
        pool = await get_db_pool()
        if pool:
            async with pool.acquire() as conn:
                row = await conn.fetchrow(
                    "SELECT email, password_hash, is_active, role, assigned_branch_code FROM public.global_users WHERE email = $1",
                    email
                )
                if row:
                    return UserInDB(
                        email=row["email"],
                        hashed_password=row["password_hash"],
                        is_active=row["is_active"],
                        role=str(row["role"]),
                        assigned_branch_code=row["assigned_branch_code"],
                    )
    except Exception as exc:
        pass
    return None


async def authenticate_user(email: str, password: str) -> UserInDB | None:
    user = await get_user_by_email(email)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user


@app.post("/login", response_model=TokenResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends()) -> TokenResponse:
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(user.email, role=user.role, assigned_branch_code=user.assigned_branch_code)
    refresh_token = create_refresh_token(user.email)

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


class RefreshRequest(BaseModel):
    refresh_token: str


@app.post("/refresh", response_model=RefreshResponse)
async def refresh(request: RefreshRequest) -> RefreshResponse:
    payload = decode_jwt_token(request.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token type")

    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing token subject")

    user = await get_user_by_email(email)
    role = user.role if user else "operator"
    assigned_branch_code = user.assigned_branch_code if user else None

    access_token = create_access_token(email, role=role, assigned_branch_code=assigned_branch_code)
    return RefreshResponse(access_token=access_token)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
