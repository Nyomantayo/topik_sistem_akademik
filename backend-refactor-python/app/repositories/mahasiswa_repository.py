from typing import Optional

from sqlalchemy import text
from sqlalchemy.orm import Session

_BASE = """
    SELECT
        m.id, m.user_id, m.nim, m.nama, m.email, m.jurusan,
        m.semester, m.dosen_pa_id, m.created_at, m.updated_at,
        COALESCE(d.nama, '') AS dosen_pa_nama
    FROM mahasiswa m
    LEFT JOIN dosen d ON m.dosen_pa_id = d.id
"""


def _row_to_dict(row) -> dict:
    return {
        "id":           row.id,
        "user_id":      row.user_id,
        "nim":          row.nim,
        "nama":         row.nama,
        "email":        row.email,
        "jurusan":      row.jurusan,
        "semester":     row.semester,
        "dosen_pa_id":  row.dosen_pa_id,
        "dosen_pa_nama": row.dosen_pa_nama or None,
        "created_at":   row.created_at,
        "updated_at":   row.updated_at,
    }


class MahasiswaRepository:
    def __init__(self, db: Session):
        self.db = db

    def find_all(self, page: int, limit: int, search: str = "") -> tuple[list[dict], int]:
        offset = (page - 1) * limit
        if search:
            like = f"%{search}%"
            where = "WHERE (m.nama LIKE :s OR m.nim LIKE :s OR m.email LIKE :s OR m.jurusan LIKE :s)"
            total = self.db.execute(
                text(f"SELECT COUNT(*) FROM mahasiswa m {where}"),
                {"s": like},
            ).scalar()
            rows = self.db.execute(
                text(f"{_BASE} {where} ORDER BY m.created_at DESC LIMIT :lim OFFSET :off"),
                {"s": like, "lim": limit, "off": offset},
            ).fetchall()
        else:
            total = self.db.execute(text("SELECT COUNT(*) FROM mahasiswa m")).scalar()
            rows = self.db.execute(
                text(f"{_BASE} ORDER BY m.created_at DESC LIMIT :lim OFFSET :off"),
                {"lim": limit, "off": offset},
            ).fetchall()
        return [_row_to_dict(r) for r in rows], int(total or 0)

    def find_by_id(self, id: int) -> Optional[dict]:
        row = self.db.execute(
            text(f"{_BASE} WHERE m.id = :id LIMIT 1"),
            {"id": id},
        ).fetchone()
        return _row_to_dict(row) if row else None

    def find_by_user_id(self, user_id: int) -> Optional[dict]:
        row = self.db.execute(
            text(f"{_BASE} WHERE m.user_id = :uid LIMIT 1"),
            {"uid": user_id},
        ).fetchone()
        return _row_to_dict(row) if row else None

    def find_by_nim(self, nim: str) -> Optional[dict]:
        row = self.db.execute(
            text(f"{_BASE} WHERE m.nim = :nim LIMIT 1"),
            {"nim": nim},
        ).fetchone()
        return _row_to_dict(row) if row else None

    def find_by_email(self, email: str) -> Optional[dict]:
        row = self.db.execute(
            text(f"{_BASE} WHERE m.email = :email LIMIT 1"),
            {"email": email},
        ).fetchone()
        return _row_to_dict(row) if row else None

    def find_by_dosen_pa(self, dosen_id: int, page: int, limit: int, search: str = "") -> tuple[list[dict], int]:
        offset = (page - 1) * limit
        if search:
            like = f"%{search}%"
            extra = "AND (m.nama LIKE :s OR m.nim LIKE :s OR m.email LIKE :s)"
            total = self.db.execute(
                text(f"SELECT COUNT(*) FROM mahasiswa m WHERE m.dosen_pa_id = :did {extra}"),
                {"did": dosen_id, "s": like},
            ).scalar()
            rows = self.db.execute(
                text(f"{_BASE} WHERE m.dosen_pa_id = :did {extra} ORDER BY m.nama ASC LIMIT :lim OFFSET :off"),
                {"did": dosen_id, "s": like, "lim": limit, "off": offset},
            ).fetchall()
        else:
            total = self.db.execute(
                text("SELECT COUNT(*) FROM mahasiswa m WHERE m.dosen_pa_id = :did"),
                {"did": dosen_id},
            ).scalar()
            rows = self.db.execute(
                text(f"{_BASE} WHERE m.dosen_pa_id = :did ORDER BY m.nama ASC LIMIT :lim OFFSET :off"),
                {"did": dosen_id, "lim": limit, "off": offset},
            ).fetchall()
        return [_row_to_dict(r) for r in rows], int(total or 0)

    def create(self, data: dict) -> int:
        result = self.db.execute(
            text(
                "INSERT INTO mahasiswa (user_id, nim, nama, email, jurusan, semester, dosen_pa_id) "
                "VALUES (:user_id, :nim, :nama, :email, :jurusan, :semester, :dosen_pa_id)"
            ),
            data,
        )
        self.db.commit()
        return result.lastrowid

    def update(self, id: int, data: dict) -> None:
        data["id"] = id
        self.db.execute(
            text(
                "UPDATE mahasiswa SET nim=:nim, nama=:nama, email=:email, jurusan=:jurusan, "
                "semester=:semester, dosen_pa_id=:dosen_pa_id, updated_at=NOW() WHERE id=:id"
            ),
            data,
        )
        self.db.commit()

    def delete(self, id: int) -> None:
        self.db.execute(text("DELETE FROM mahasiswa WHERE id = :id"), {"id": id})
        self.db.commit()

    def count_total(self) -> int:
        return int(self.db.execute(text("SELECT COUNT(*) FROM mahasiswa")).scalar() or 0)

    def count_by_jurusan(self) -> list[dict]:
        rows = self.db.execute(
            text("SELECT jurusan, COUNT(*) as count FROM mahasiswa GROUP BY jurusan ORDER BY count DESC")
        ).fetchall()
        return [{"jurusan": r.jurusan, "count": r.count} for r in rows]
