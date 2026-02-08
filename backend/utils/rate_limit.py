import logging
import os
from collections import defaultdict, deque
from threading import Lock
from time import monotonic
from typing import Deque, Dict, Tuple

from .redis_client import get_redis

logger = logging.getLogger(__name__)


def _parse_rate_limit(value: str, default: Tuple[int, int]) -> Tuple[int, int]:
    try:
        max_req, window = value.split("/", 1)
        return int(max_req), int(window)
    except Exception:
        return default


class SimpleRateLimiter:
    """In-memory fallback rate limiter."""

    def __init__(self, max_requests: int, window_seconds: int) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._hits: Dict[str, Deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def allow(self, key: str) -> bool:
        now = monotonic()
        with self._lock:
            queue = self._hits[key]
            while queue and queue[0] <= now - self.window_seconds:
                queue.popleft()
            if len(queue) >= self.max_requests:
                return False
            queue.append(now)
            return True


class RedisRateLimiter:
    """Redis-backed rate limiter with in-memory fallback."""

    def __init__(self, max_requests: int, window_seconds: int) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._fallback = SimpleRateLimiter(max_requests, window_seconds)

    def allow(self, key: str) -> bool:
        r = get_redis()
        if r is None:
            return self._fallback.allow(key)

        redis_key = f"rate_limit:{key}"
        try:
            count = r.incr(redis_key)
            if count == 1:
                r.expire(redis_key, self.window_seconds)
            return count <= self.max_requests
        except Exception as exc:
            logger.warning("Redis rate-limit error (%s) – falling back to memory.", exc)
            return self._fallback.allow(key)


_default_limit = (5, 60)
_limit_value = os.getenv("LOGIN_RATE_LIMIT", "5/60")
_max_requests, _window_seconds = _parse_rate_limit(_limit_value, _default_limit)

login_rate_limiter = RedisRateLimiter(_max_requests, _window_seconds)
