from datetime import datetime
from typing import Optional

from sqlalchemy import text
from sqlalchemy.orm import Session


class UserRecord:
    __slots__ = ("id", "name", "email", "password", "role", "created_at", "updated_at")

    def __init__(self, row):
        self.id         = row.id
        self.name       = row.name
        self.email      = row.email
        self.password   = row.password
        self.role       = row.role
        self.created_at = row.created_at
        self.updated_at = row.updated_at


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def find_by_email(self, email: str) -> Optional[UserRecord]:
        row = self.db.execute(
            text("SELECT * FROM users WHERE email = :email LIMIT 1"),
            {"email": email},
        ).fetchone()
        return UserRecord(row) if row else None

    def find_by_id(self, user_id: int) -> Optional[UserRecord]:
        row = self.db.execute(
            text("SELECT * FROM users WHERE id = :id LIMIT 1"),
            {"id": user_id},
        ).fetchone()
        return UserRecord(row) if row else None

    def create(self, name: str, email: str, password: str, role: str) -> UserRecord:
        result = self.db.execute(
            text(
                "INSERT INTO users (name, email, password, role) "
                "VALUES (:name, :email, :password, :role)"
            ),
            {"name": name, "email": email, "password": password, "role": role},
        )
        self.db.commit()
        new_id = result.lastrowid
        return self.find_by_id(new_id)

    def update_name(self, user_id: int, name: str) -> None:
        self.db.execute(
            text("UPDATE users SET name = :name, updated_at = NOW() WHERE id = :id"),
            {"name": name, "id": user_id},
        )
        self.db.commit()

    def update_password(self, user_id: int, hashed: str) -> None:
        self.db.execute(
            text("UPDATE users SET password = :pw, updated_at = NOW() WHERE id = :id"),
            {"pw": hashed, "id": user_id},
        )
        self.db.commit()
