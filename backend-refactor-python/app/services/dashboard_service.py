from sqlalchemy.orm import Session

from ..redis_client import cache
from ..repositories.dosen_repository import DosenRepository
from ..repositories.mahasiswa_repository import MahasiswaRepository

_TTL = 2 * 60  # 2 minutes


class DashboardService:
    def __init__(self, db: Session):
        self.mhs_repo   = MahasiswaRepository(db)
        self.dosen_repo = DosenRepository(db)

    def get_stats(self) -> dict:
        key = "dashboard:stats"
        cached = cache.get(key)
        if cached:
            return cached

        stats = {
            "total_mahasiswa":       self.mhs_repo.count_total(),
            "total_dosen":           self.dosen_repo.count_total(),
            "mahasiswa_per_jurusan": self.mhs_repo.count_by_jurusan(),
            "dosen_per_prodi":       self.dosen_repo.count_by_prodi(),
        }

        cache.set(key, stats, _TTL)
        return stats
