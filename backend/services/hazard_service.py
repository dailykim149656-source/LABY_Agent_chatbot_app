import logging
import re
import time
from collections import OrderedDict
from typing import Optional

from ..repositories import hazard_repo

logger = logging.getLogger(__name__)

# =================================================================
# 캐시 설정
# =================================================================
_CACHE_TTL_SECONDS = 300
_CACHE_MAXSIZE = 256
_CACHE: "OrderedDict[str, tuple[float, dict]]" = OrderedDict()


def _get_cache(key: str) -> Optional[dict]:
    cached = _CACHE.get(key)
    if not cached:
        return None
    cached_at, value = cached
    if time.time() - cached_at > _CACHE_TTL_SECONDS:
        _CACHE.pop(key, None)
        return None
    _CACHE.move_to_end(key)
    return value


def _set_cache(key: str, value: dict) -> None:
    _CACHE[key] = (time.time(), value)
    _CACHE.move_to_end(key)
    if len(_CACHE) > _CACHE_MAXSIZE:
        _CACHE.popitem(last=False)


# =================================================================
# 비즈니스 로직
# =================================================================
def search_hazard(chem_name: str) -> dict:
    """화학물질명으로 유해성 정보 검색 (캐시 → 정확일치 → 공백무시 → 원본)"""
    cleaned_name = re.sub(r'\s*#\d+\s*$', '', chem_name)

    cached = _get_cache(cleaned_name)
    if cached:
        return cached

    nospace_name = cleaned_name.replace(" ", "")

    try:
        # 1. 정확 일치
        hazard = hazard_repo.find_by_exact_name(cleaned_name)
        if hazard:
            response = {"status": "success", "hazard": hazard}
            _set_cache(cleaned_name, response)
            return response

        # 2. 공백 무시
        hazard = hazard_repo.find_by_nospace_name(nospace_name)
        if hazard:
            response = {"status": "success", "hazard": hazard}
            _set_cache(cleaned_name, response)
            return response

        # 3. 원본 이름 (정제 전 값)
        if cleaned_name != chem_name:
            hazard = hazard_repo.find_by_exact_name(chem_name)
            if hazard:
                response = {"status": "success", "hazard": hazard}
                _set_cache(cleaned_name, response)
                return response

        response = {"status": "fail", "hazard": "정보 없음"}
        _set_cache(cleaned_name, response)
        return response

    except Exception as e:
        logger.exception("MSDS DB query failed: %s", e)
        return {"status": "error", "message": str(e)}
