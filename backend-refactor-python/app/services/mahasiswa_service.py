from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..redis_client import cache
from ..repositories.dosen_repository import DosenRepository
from ..repositories.mahasiswa_repository import MahasiswaRepository
from ..schemas.mahasiswa import (
    CreateMahasiswaRequest,
    MahasiswaResponse,
    UpdateMahasiswaRequest,
)

_TTL_LIST = 5 * 60   # 5 minutes
_TTL_ITEM = 10 * 60  # 10 minutes


class MahasiswaService:
    def __init__(self, db: Session):
        self.repo       = MahasiswaRepository(db)
        self.dosen_repo = DosenRepository(db)

    def get_all(self, page: int, limit: int, search: str) -> tuple[list[MahasiswaResponse], int]:
        key = f"mahasiswa:list:p={page}:l={limit}:q={search}"
        cached = cache.get(key)
        if cached:
            items = [MahasiswaResponse(**i) for i in cached["items"]]
            return items, cached["total"]

        rows, total = self.repo.find_all(page, limit, search)
        items = [MahasiswaResponse(**r) for r in rows]
        cache.set(key, {"items": [i.model_dump(mode="json") for i in items], "total": total}, _TTL_LIST)
        return items, total

    def get_by_id(self, id: int) -> MahasiswaResponse:
        key = f"mahasiswa:{id}"
        cached = cache.get(key)
        if cached:
            return MahasiswaResponse(**cached)

        row = self.repo.find_by_id(id)
        if not row:
            raise HTTPException(status_code=404, detail="Mahasiswa tidak ditemukan")
        result = MahasiswaResponse(**row)
        cache.set(key, result.model_dump(mode="json"), _TTL_ITEM)
        return result

    def get_my_profile(self, user_id: int) -> MahasiswaResponse:
        row = self.repo.find_by_user_id(user_id)
        if not row:
            raise HTTPException(status_code=404, detail="Data mahasiswa tidak ditemukan untuk akun ini")
        return MahasiswaResponse(**row)

    def create(self, req: CreateMahasiswaRequest) -> MahasiswaResponse:
        if self.repo.find_by_nim(req.nim):
            raise HTTPException(status_code=409, detail="NIM sudah terdaftar")
        if self.repo.find_by_email(req.email):
            raise HTTPException(status_code=409, detail="Email mahasiswa sudah terdaftar")
        if req.dosen_pa_id and not self.dosen_repo.find_by_id(req.dosen_pa_id):
            raise HTTPException(status_code=404, detail="Dosen PA tidak ditemukan")

        data = {
            "user_id":     req.user_id,
            "nim":         req.nim,
            "nama":        req.nama,
            "email":       req.email,
            "jurusan":     req.jurusan,
            "semester":    req.semester,
            "dosen_pa_id": req.dosen_pa_id,
        }
        new_id = self.repo.create(data)
        self._invalidate_cache()
        row = self.repo.find_by_id(new_id)
        return MahasiswaResponse(**row)

    def update(self, id: int, req: UpdateMahasiswaRequest) -> MahasiswaResponse:
        row = self.repo.find_by_id(id)
        if not row:
            raise HTTPException(status_code=404, detail="Mahasiswa tidak ditemukan")

        nim      = req.nim      if req.nim      else row["nim"]
        nama     = req.nama     if req.nama     else row["nama"]
        email    = req.email    if req.email    else row["email"]
        jurusan  = req.jurusan  if req.jurusan  else row["jurusan"]
        semester = req.semester if req.semester else row["semester"]
        dosen_pa_id = req.dosen_pa_id  # can be None to clear

        if nim != row["nim"] and self.repo.find_by_nim(nim):
            raise HTTPException(status_code=409, detail="NIM sudah digunakan mahasiswa lain")
        if email != row["email"] and self.repo.find_by_email(email):
            raise HTTPException(status_code=409, detail="Email sudah digunakan mahasiswa lain")
        if dosen_pa_id and not self.dosen_repo.find_by_id(dosen_pa_id):
            raise HTTPException(status_code=404, detail="Dosen PA tidak ditemukan")

        self.repo.update(id, {
            "nim":         nim,
            "nama":        nama,
            "email":       email,
            "jurusan":     jurusan,
            "semester":    semester,
            "dosen_pa_id": dosen_pa_id,
        })
        self._invalidate_cache()
        cache.delete(f"mahasiswa:{id}")
        row = self.repo.find_by_id(id)
        return MahasiswaResponse(**row)

    def delete(self, id: int) -> None:
        if not self.repo.find_by_id(id):
            raise HTTPException(status_code=404, detail="Mahasiswa tidak ditemukan")
        self.repo.delete(id)
        self._invalidate_cache()
        cache.delete(f"mahasiswa:{id}")

    def _invalidate_cache(self):
        cache.delete_pattern("mahasiswa:list:*")
        cache.delete_pattern("dosen:*:mahasiswa*")
        cache.delete("dashboard:stats")
