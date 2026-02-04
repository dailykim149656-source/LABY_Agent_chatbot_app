import os
from collections import defaultdict, deque
from threading import Lock
from time import monotonic
from typing import Deque, Dict, Tuple


def _parse_rate_limit(value: str, default: Tuple[int, int]) -> Tuple[int, int]:
    try:
        max_req, window = value.split("/", 1)
        return int(max_req), int(window)
    except Exception:
        return default


class SimpleRateLimiter:
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


_default_limit = (5, 60)
_limit_value = os.getenv("LOGIN_RATE_LIMIT", "5/60")
_max_requests, _window_seconds = _parse_rate_limit(_limit_value, _default_limit)

login_rate_limiter = SimpleRateLimiter(_max_requests, _window_seconds)
