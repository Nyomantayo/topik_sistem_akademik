from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_auth_user, require_admin
from ..schemas.dosen import CreateDosenRequest, UpdateDosenRequest
from ..schemas.common import ok, paginated
from ..services.dosen_service import DosenService

router = APIRouter(prefix="/dosen", tags=["Dosen"])


@router.get("")
def get_all(
    page:   int = Query(1,  ge=1),
    limit:  int = Query(10, ge=1, le=100),
    search: str = Query(""),
    _: Annotated[dict, Depends(get_auth_user)] = None,
    db: Session = Depends(get_db),
):
    svc = DosenService(db)
    items, total = svc.get_all(page, limit, search)
    return paginated(
        "Data dosen berhasil diambil",
        [i.model_dump(mode="json") for i in items],
        page, limit, total,
    )


@router.get("/{id}/mahasiswa")
def get_mahasiswa_bimbingan(
    id:     int,
    page:   int = Query(1,  ge=1),
    limit:  int = Query(10, ge=1, le=100),
    search: str = Query(""),
    _: Annotated[dict, Depends(get_auth_user)] = None,
    db: Session = Depends(get_db),
):
    svc = DosenService(db)
    items, total = svc.get_mahasiswa_bimbingan(id, page, limit, search)
    return paginated(
        "Data mahasiswa bimbingan berhasil diambil",
        [i.model_dump(mode="json") for i in items],
        page, limit, total,
    )


@router.get("/{id}")
def get_by_id(
    id: int,
    _: Annotated[dict, Depends(get_auth_user)] = None,
    db: Session = Depends(get_db),
):
    svc = DosenService(db)
    dosen = svc.get_by_id(id)
    return ok("Detail dosen berhasil diambil", dosen.model_dump(mode="json"))


@router.post("", status_code=201)
def create(
    req: CreateDosenRequest,
    current_user: Annotated[dict, Depends(require_admin)],
    db: Session = Depends(get_db),
):
    svc = DosenService(db)
    dosen = svc.create(req)
    return ok("Dosen berhasil ditambahkan", dosen.model_dump(mode="json"))


@router.put("/{id}")
def update(
    id: int,
    req: UpdateDosenRequest,
    current_user: Annotated[dict, Depends(require_admin)],
    db: Session = Depends(get_db),
):
    svc = DosenService(db)
    dosen = svc.update(id, req)
    return ok("Dosen berhasil diperbarui", dosen.model_dump(mode="json"))


@router.delete("/{id}")
def delete(
    id: int,
    current_user: Annotated[dict, Depends(require_admin)],
    db: Session = Depends(get_db),
):
    svc = DosenService(db)
    svc.delete(id)
    return ok("Dosen berhasil dihapus")
