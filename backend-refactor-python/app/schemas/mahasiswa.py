from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class MahasiswaResponse(BaseModel):
    id: int
    user_id: Optional[int]
    nim: str
    nama: str
    email: str
    jurusan: str
    semester: int
    dosen_pa_id: Optional[int]
    dosen_pa_nama: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CreateMahasiswaRequest(BaseModel):
    user_id: Optional[int] = None
    nim: str
    nama: str
    email: str
    jurusan: str
    semester: int = 1
    dosen_pa_id: Optional[int] = None


class UpdateMahasiswaRequest(BaseModel):
    nim: Optional[str] = None
    nama: Optional[str] = None
    email: Optional[str] = None
    jurusan: Optional[str] = None
    semester: Optional[int] = None
    dosen_pa_id: Optional[int] = None
