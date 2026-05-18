from datetime import datetime, timezone, timedelta
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from .config import settings

# ── Password hashing ──────────────────────────────────────────────────────────
_pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return _pwd_ctx.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return _pwd_ctx.verify(plain, hashed)


# ── JWT ───────────────────────────────────────────────────────────────────────
ALGORITHM = "HS256"


def create_token(
    user_id: int,
    email: str,
    role: str,
    name: str,
    expiry_hours: int | None = None,
) -> str:
    if expiry_hours is None:
        expiry_hours = settings.jwt_expiry

    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub":     email,
        "exp":     now + timedelta(hours=expiry_hours),
        "iat":     now,
        "user_id": user_id,
        "email":   email,
        "role":    role,
        "name":    name,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    """
    Decode & validate a JWT.
    Raises jose.JWTError on failure.
    """
    return jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
