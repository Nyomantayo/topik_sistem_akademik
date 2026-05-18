from datetime import datetime, timezone, timedelta
from typing import Any

import bcrypt
from jose import JWTError, jwt

from .config import settings

# ── Password hashing ──────────────────────────────────────────────────────────
# Use bcrypt directly — bypasses passlib 1.7.4 / bcrypt 4.x incompatibility.


def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


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
