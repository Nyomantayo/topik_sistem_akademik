from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..repositories.user_repository import UserRepository
from ..schemas.auth import (
    AuthResponse,
    ChangePasswordRequest,
    LoginRequest,
    RegisterRequest,
    UpdateProfileRequest,
    UserProfile,
)
from ..security import create_token, hash_password, verify_password
from ..config import settings


class AuthService:
    def __init__(self, db: Session):
        self.repo = UserRepository(db)

    def register(self, req: RegisterRequest) -> AuthResponse:
        if self.repo.find_by_email(req.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email sudah terdaftar",
            )
        hashed = hash_password(req.password)
        user = self.repo.create(req.name, req.email, hashed, req.role)
        token = create_token(user.id, user.email, user.role, user.name)
        return AuthResponse(
            token=token,
            user=UserProfile(
                id=user.id,
                name=user.name,
                email=user.email,
                role=user.role,
                created_at=user.created_at,
                updated_at=user.updated_at,
            ),
        )

    def login(self, req: LoginRequest) -> AuthResponse:
        user = self.repo.find_by_email(req.email)
        if not user or not verify_password(req.password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email atau password salah",
            )
        token = create_token(user.id, user.email, user.role, user.name)
        return AuthResponse(
            token=token,
            user=UserProfile(
                id=user.id,
                name=user.name,
                email=user.email,
                role=user.role,
                created_at=user.created_at,
                updated_at=user.updated_at,
            ),
        )

    @staticmethod
    def guest_login() -> AuthResponse:
        token = create_token(0, "guest@krs.ac.id", "guest", "Tamu", expiry_hours=2)
        now = datetime.now(timezone.utc)
        return AuthResponse(
            token=token,
            user=UserProfile(
                id=0,
                name="Tamu",
                email="guest@krs.ac.id",
                role="guest",
                created_at=now,
                updated_at=now,
            ),
        )

    def get_profile(self, user_id: int) -> UserProfile:
        user = self.repo.find_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User tidak ditemukan")
        return UserProfile(
            id=user.id,
            name=user.name,
            email=user.email,
            role=user.role,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )

    def update_profile(self, user_id: int, req: UpdateProfileRequest) -> UserProfile:
        user = self.repo.find_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User tidak ditemukan")
        self.repo.update_name(user_id, req.name)
        updated = self.repo.find_by_id(user_id)
        return UserProfile(
            id=updated.id,
            name=updated.name,
            email=updated.email,
            role=updated.role,
            created_at=updated.created_at,
            updated_at=updated.updated_at,
        )

    def change_password(self, user_id: int, req: ChangePasswordRequest) -> None:
        user = self.repo.find_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User tidak ditemukan")
        if not verify_password(req.old_password, user.password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password lama tidak sesuai",
            )
        self.repo.update_password(user_id, hash_password(req.new_password))
