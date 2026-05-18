from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError

from .security import decode_token

_bearer = HTTPBearer()


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
) -> dict:
    """
    Extract and validate JWT from Authorization header.
    Returns the decoded claims dict.
    """
    try:
        return decode_token(credentials.credentials)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak valid atau sudah kedaluwarsa",
        )


def get_auth_user(
    current_user: Annotated[dict, Depends(get_current_user)],
) -> dict:
    """Alias for get_current_user — used where any authenticated user (incl. guest) is OK."""
    return current_user


def get_non_guest_user(
    current_user: Annotated[dict, Depends(get_current_user)],
) -> dict:
    """Blocks guest users from accessing protected features."""
    if current_user.get("role") == "guest":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Fitur ini tidak tersedia untuk tamu. Silakan login terlebih dahulu.",
        )
    return current_user


def require_admin(
    current_user: Annotated[dict, Depends(get_non_guest_user)],
) -> dict:
    """Only admin can pass."""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses hanya untuk admin",
        )
    return current_user
