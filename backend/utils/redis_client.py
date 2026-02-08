from __future__ import annotations

import logging
import os
from typing import Optional

import redis

logger = logging.getLogger(__name__)

_client: Optional[redis.Redis] = None


def init_redis() -> Optional[redis.Redis]:
    """Initialize the Redis connection. Returns None if Redis is unavailable."""
    global _client
    url = os.getenv("REDIS_URL")
    if not url:
        logger.info("REDIS_URL not set – Redis disabled, using fallback.")
        return None

    try:
        client = redis.from_url(url, decode_responses=True, socket_connect_timeout=3)
        client.ping()
        _client = client
        logger.info("Redis connected: %s", url)
        return _client
    except Exception as exc:
        logger.warning("Redis connection failed (%s) – using fallback.", exc)
        _client = None
        return None


def get_redis() -> Optional[redis.Redis]:
    """Return the current Redis client, or None if unavailable."""
    return _client
