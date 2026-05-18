from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_auth_user, require_admin
from ..schemas.mahasiswa import CreateMahasiswaRequest, UpdateMahasiswaRequest
from ..schemas.common import ok, paginated
from ..services.mahasiswa_service import MahasiswaService

router = APIRouter(prefix="/mahasiswa", tags=["Mahasiswa"])


@router.get("/me")
def get_me(
    current_user: Annotated[dict, Depends(get_auth_user)],
    db: Session = Depends(get_db),
):
    svc = MahasiswaService(db)
    mhs = svc.get_my_profile(current_user["user_id"])
    return ok("Data mahasiswa berhasil diambil", mhs.model_dump(mode="json"))


@router.get("")
def get_all(
    page:   int = Query(1,  ge=1),
    limit:  int = Query(10, ge=1, le=100),
    search: str = Query(""),
    _: Annotated[dict, Depends(get_auth_user)] = None,
    db: Session = Depends(get_db),
):
    svc = MahasiswaService(db)
    items, total = svc.get_all(page, limit, search)
    return paginated(
        "Data mahasiswa berhasil diambil",
        [i.model_dump(mode="json") for i in items],
        page, limit, total,
    )


@router.get("/{id}")
def get_by_id(
    id: int,
    _: Annotated[dict, Depends(get_auth_user)] = None,
    db: Session = Depends(get_db),
):
    svc = MahasiswaService(db)
    mhs = svc.get_by_id(id)
    return ok("Detail mahasiswa berhasil diambil", mhs.model_dump(mode="json"))


@router.post("", status_code=201)
def create(
    req: CreateMahasiswaRequest,
    current_user: Annotated[dict, Depends(require_admin)],
    db: Session = Depends(get_db),
):
    svc = MahasiswaService(db)
    mhs = svc.create(req)
    return ok("Mahasiswa berhasil ditambahkan", mhs.model_dump(mode="json"))


@router.put("/{id}")
def update(
    id: int,
    req: UpdateMahasiswaRequest,
    current_user: Annotated[dict, Depends(require_admin)],
    db: Session = Depends(get_db),
):
    svc = MahasiswaService(db)
    mhs = svc.update(id, req)
    return ok("Mahasiswa berhasil diperbarui", mhs.model_dump(mode="json"))


@router.delete("/{id}")
def delete(
    id: int,
    current_user: Annotated[dict, Depends(require_admin)],
    db: Session = Depends(get_db),
):
    svc = MahasiswaService(db)
    svc.delete(id)
    return ok("Mahasiswa berhasil dihapus")
