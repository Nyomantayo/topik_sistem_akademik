from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_non_guest_user
from ..schemas.common import ok
from ..services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_stats(
    current_user: Annotated[dict, Depends(get_non_guest_user)],
    db: Session = Depends(get_db),
):
    svc = DashboardService(db)
    stats = svc.get_stats()
    return ok("Statistik dashboard berhasil diambil", stats)
