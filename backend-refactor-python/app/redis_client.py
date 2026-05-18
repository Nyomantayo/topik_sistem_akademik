import json
from typing import Any, Optional

import redis as redis_lib

from .config import settings

_client: Optional[redis_lib.Redis] = None


def _get_client() -> redis_lib.Redis:
    global _client
    if _client is None:
        _client = redis_lib.Redis(
            host=settings.redis_host,
            port=settings.redis_port,
            password=settings.redis_pass or None,
            db=0,
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5,
        )
    return _client


class RedisCache:
    """
    Thin wrapper di atas redis-py.
    Semua error ditangkap agar Redis tidak crash aplikasi utama.
    """

    def get(self, key: str) -> Optional[Any]:
        try:
            raw = _get_client().get(key)
            if raw is not None:
                return json.loads(raw)
        except Exception:
            pass
        return None

    def set(self, key: str, value: Any, ttl_seconds: int = 300) -> None:
        try:
            _get_client().setex(key, ttl_seconds, json.dumps(value, default=str))
        except Exception:
            pass

    def delete(self, key: str) -> None:
        try:
            _get_client().delete(key)
        except Exception:
            pass

    def delete_pattern(self, pattern: str) -> None:
        try:
            keys = _get_client().keys(pattern)
            if keys:
                _get_client().delete(*keys)
        except Exception:
            pass


# Singleton instance dipakai di seluruh aplikasi
cache = RedisCache()
