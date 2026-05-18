from typing import Optional

from sqlalchemy import text
from sqlalchemy.orm import Session


def _row_to_dict(row) -> dict:
    return {
        "id":         row.id,
        "user_id":    row.user_id,
        "nidn":       row.nidn,
        "nama":       row.nama,
        "email":      row.email,
        "prodi":      row.prodi,
        "created_at": row.created_at,
        "updated_at": row.updated_at,
    }


class DosenRepository:
    def __init__(self, db: Session):
        self.db = db

    def find_all(self, page: int, limit: int, search: str = "") -> tuple[list[dict], int]:
        offset = (page - 1) * limit
        if search:
            like = f"%{search}%"
            where = "WHERE (nama LIKE :s OR nidn LIKE :s OR email LIKE :s OR prodi LIKE :s)"
            total = self.db.execute(
                text(f"SELECT COUNT(*) FROM dosen {where}"),
                {"s": like},
            ).scalar()
            rows = self.db.execute(
                text(f"SELECT * FROM dosen {where} ORDER BY created_at DESC LIMIT :lim OFFSET :off"),
                {"s": like, "lim": limit, "off": offset},
            ).fetchall()
        else:
            total = self.db.execute(text("SELECT COUNT(*) FROM dosen")).scalar()
            rows = self.db.execute(
                text("SELECT * FROM dosen ORDER BY created_at DESC LIMIT :lim OFFSET :off"),
                {"lim": limit, "off": offset},
            ).fetchall()
        return [_row_to_dict(r) for r in rows], int(total or 0)

    def find_by_id(self, id: int) -> Optional[dict]:
        row = self.db.execute(
            text("SELECT * FROM dosen WHERE id = :id LIMIT 1"),
            {"id": id},
        ).fetchone()
        return _row_to_dict(row) if row else None

    def find_by_nidn(self, nidn: str) -> Optional[dict]:
        row = self.db.execute(
            text("SELECT * FROM dosen WHERE nidn = :nidn LIMIT 1"),
            {"nidn": nidn},
        ).fetchone()
        return _row_to_dict(row) if row else None

    def find_by_email(self, email: str) -> Optional[dict]:
        row = self.db.execute(
            text("SELECT * FROM dosen WHERE email = :email LIMIT 1"),
            {"email": email},
        ).fetchone()
        return _row_to_dict(row) if row else None

    def find_by_user_id(self, user_id: int) -> Optional[dict]:
        row = self.db.execute(
            text("SELECT * FROM dosen WHERE user_id = :uid LIMIT 1"),
            {"uid": user_id},
        ).fetchone()
        return _row_to_dict(row) if row else None

    def create(self, data: dict) -> int:
        result = self.db.execute(
            text(
                "INSERT INTO dosen (user_id, nidn, nama, email, prodi) "
                "VALUES (:user_id, :nidn, :nama, :email, :prodi)"
            ),
            data,
        )
        self.db.commit()
        return result.lastrowid

    def update(self, id: int, data: dict) -> None:
        data["id"] = id
        self.db.execute(
            text(
                "UPDATE dosen SET nidn=:nidn, nama=:nama, email=:email, "
                "prodi=:prodi, updated_at=NOW() WHERE id=:id"
            ),
            data,
        )
        self.db.commit()

    def delete(self, id: int) -> None:
        self.db.execute(text("DELETE FROM dosen WHERE id = :id"), {"id": id})
        self.db.commit()

    def count_total(self) -> int:
        return int(self.db.execute(text("SELECT COUNT(*) FROM dosen")).scalar() or 0)

    def count_by_prodi(self) -> list[dict]:
        rows = self.db.execute(
            text("SELECT prodi, COUNT(*) as count FROM dosen GROUP BY prodi ORDER BY count DESC")
        ).fetchall()
        return [{"prodi": r.prodi, "count": r.count} for r in rows]
