from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..redis_client import cache
from ..repositories.dosen_repository import DosenRepository
from ..repositories.mahasiswa_repository import MahasiswaRepository
from ..schemas.dosen import CreateDosenRequest, DosenResponse, UpdateDosenRequest
from ..schemas.mahasiswa import MahasiswaResponse

_TTL_LIST = 5 * 60
_TTL_ITEM = 10 * 60


class DosenService:
    def __init__(self, db: Session):
        self.repo          = DosenRepository(db)
        self.mhs_repo      = MahasiswaRepository(db)

    def get_all(self, page: int, limit: int, search: str) -> tuple[list[DosenResponse], int]:
        key = f"dosen:list:p={page}:l={limit}:q={search}"
        cached = cache.get(key)
        if cached:
            items = [DosenResponse(**i) for i in cached["items"]]
            return items, cached["total"]

        rows, total = self.repo.find_all(page, limit, search)
        items = [DosenResponse(**r) for r in rows]
        cache.set(key, {"items": [i.model_dump(mode="json") for i in items], "total": total}, _TTL_LIST)
        return items, total

    def get_by_id(self, id: int) -> DosenResponse:
        key = f"dosen:{id}"
        cached = cache.get(key)
        if cached:
            return DosenResponse(**cached)

        row = self.repo.find_by_id(id)
        if not row:
            raise HTTPException(status_code=404, detail="Dosen tidak ditemukan")
        result = DosenResponse(**row)
        cache.set(key, result.model_dump(mode="json"), _TTL_ITEM)
        return result

    def get_mahasiswa_bimbingan(
        self, dosen_id: int, page: int, limit: int, search: str
    ) -> tuple[list[MahasiswaResponse], int]:
        if not self.repo.find_by_id(dosen_id):
            raise HTTPException(status_code=404, detail="Dosen tidak ditemukan")

        key = f"dosen:{dosen_id}:mahasiswa:p={page}:l={limit}:q={search}"
        cached = cache.get(key)
        if cached:
            items = [MahasiswaResponse(**i) for i in cached["items"]]
            return items, cached["total"]

        rows, total = self.mhs_repo.find_by_dosen_pa(dosen_id, page, limit, search)
        items = [MahasiswaResponse(**r) for r in rows]
        cache.set(key, {"items": [i.model_dump(mode="json") for i in items], "total": total}, _TTL_LIST)
        return items, total

    def create(self, req: CreateDosenRequest) -> DosenResponse:
        if self.repo.find_by_nidn(req.nidn):
            raise HTTPException(status_code=409, detail="NIDN sudah terdaftar")
        if self.repo.find_by_email(req.email):
            raise HTTPException(status_code=409, detail="Email dosen sudah terdaftar")

        data = {
            "user_id": req.user_id,
            "nidn":    req.nidn,
            "nama":    req.nama,
            "email":   req.email,
            "prodi":   req.prodi,
        }
        new_id = self.repo.create(data)
        self._invalidate_cache()
        row = self.repo.find_by_id(new_id)
        return DosenResponse(**row)

    def update(self, id: int, req: UpdateDosenRequest) -> DosenResponse:
        row = self.repo.find_by_id(id)
        if not row:
            raise HTTPException(status_code=404, detail="Dosen tidak ditemukan")

        nidn  = req.nidn  if req.nidn  else row["nidn"]
        nama  = req.nama  if req.nama  else row["nama"]
        email = req.email if req.email else row["email"]
        prodi = req.prodi if req.prodi else row["prodi"]

        if nidn != row["nidn"] and self.repo.find_by_nidn(nidn):
            raise HTTPException(status_code=409, detail="NIDN sudah digunakan dosen lain")
        if email != row["email"] and self.repo.find_by_email(email):
            raise HTTPException(status_code=409, detail="Email sudah digunakan dosen lain")

        self.repo.update(id, {"nidn": nidn, "nama": nama, "email": email, "prodi": prodi})
        self._invalidate_cache()
        cache.delete(f"dosen:{id}")
        row = self.repo.find_by_id(id)
        return DosenResponse(**row)

    def delete(self, id: int) -> None:
        if not self.repo.find_by_id(id):
            raise HTTPException(status_code=404, detail="Dosen tidak ditemukan")
        self.repo.delete(id)
        self._invalidate_cache()
        cache.delete(f"dosen:{id}")

    def _invalidate_cache(self):
        cache.delete_pattern("dosen:list:*")
        cache.delete("dashboard:stats")
