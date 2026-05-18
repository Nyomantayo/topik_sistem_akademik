from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_non_guest_user
from ..schemas.auth import (
    AuthResponse,
    ChangePasswordRequest,
    LoginRequest,
    RegisterRequest,
    UpdateProfileRequest,
)
from ..schemas.common import ok
from ..services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", status_code=201)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    svc = AuthService(db)
    result = svc.register(req)
    return ok("Registrasi berhasil", result.model_dump(mode="json"))


@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    svc = AuthService(db)
    result = svc.login(req)
    return ok("Login berhasil", result.model_dump(mode="json"))


@router.post("/guest")
def guest_login():
    result = AuthService.guest_login()
    return ok("Masuk sebagai tamu berhasil", result.model_dump(mode="json"))


@router.get("/profile")
def get_profile(
    current_user: Annotated[dict, Depends(get_non_guest_user)],
    db: Session = Depends(get_db),
):
    svc = AuthService(db)
    profile = svc.get_profile(current_user["user_id"])
    return ok("Profil berhasil diambil", profile.model_dump(mode="json"))


@router.put("/profile")
def update_profile(
    req: UpdateProfileRequest,
    current_user: Annotated[dict, Depends(get_non_guest_user)],
    db: Session = Depends(get_db),
):
    svc = AuthService(db)
    profile = svc.update_profile(current_user["user_id"], req)
    return ok("Profil berhasil diperbarui", profile.model_dump(mode="json"))


@router.put("/change-password")
def change_password(
    req: ChangePasswordRequest,
    current_user: Annotated[dict, Depends(get_non_guest_user)],
    db: Session = Depends(get_db),
):
    svc = AuthService(db)
    svc.change_password(current_user["user_id"], req)
    return ok("Password berhasil diubah")
