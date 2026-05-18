from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class DosenResponse(BaseModel):
    id: int
    user_id: Optional[int]
    nidn: str
    nama: str
    email: str
    prodi: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CreateDosenRequest(BaseModel):
    user_id: Optional[int] = None
    nidn: str
    nama: str
    email: str
    prodi: str


class UpdateDosenRequest(BaseModel):
    nidn: Optional[str] = None
    nama: Optional[str] = None
    email: Optional[str] = None
    prodi: Optional[str] = None
