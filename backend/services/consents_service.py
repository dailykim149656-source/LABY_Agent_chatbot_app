import json
from typing import Any, Dict, List, Optional, Tuple

from ..repositories import consents_repo


def _parse_payload(payload: str) -> Dict[str, Any]:
    try:
        return json.loads(payload) if payload else {}
    except json.JSONDecodeError:
        return {}


def list_consents(
    engine,
    limit: int,
    cursor: Optional[int] = None,
) -> Tuple[List[Dict[str, Any]], int, Optional[int]]:
    items = consents_repo.list_consents(engine, limit, cursor)
    total = consents_repo.count_consents(engine)
    next_cursor = None
    if items:
        next_cursor = int(items[-1]["consent_id"])
    for item in items:
        item["consent_payload"] = _parse_payload(item.get("consent_payload"))
    return items, total, next_cursor
