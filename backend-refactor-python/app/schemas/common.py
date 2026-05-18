import math
from typing import Any, Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class APIResponse(BaseModel):
    success: bool
    message: str
    data: Any = None


class PaginationMeta(BaseModel):
    page: int
    limit: int
    total: int
    total_pages: int
    has_next: bool
    has_prev: bool


class PaginatedAPIResponse(BaseModel):
    success: bool
    message: str
    data: Any
    pagination: PaginationMeta


def ok(message: str, data: Any = None) -> dict:
    return {"success": True, "message": message, "data": data}


def paginated(
    message: str,
    data: Any,
    page: int,
    limit: int,
    total: int,
) -> dict:
    total_pages = math.ceil(total / limit) if limit > 0 else 0
    return {
        "success": True,
        "message": message,
        "data": data,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1,
        },
    }


def error(message: str, errors: Any = None) -> dict:
    base = {"success": False, "message": message}
    if errors is not None:
        base["errors"] = errors
    return base
