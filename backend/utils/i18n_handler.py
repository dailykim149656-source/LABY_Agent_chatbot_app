"""
i18n 처리 통합 유틸리티

라우터에서 반복되는 i18n 처리 로직을 통합합니다.
"""

from typing import Callable, TypeVar, Optional, List, Any
from fastapi import Request

from ..utils.translation import resolve_target_lang, should_translate

T = TypeVar("T")


def apply_i18n(
    response: T,
    request: Request,
    attach_func: Callable,
    lang: Optional[str],
    include_i18n: bool,
) -> T:
    """
    i18n 처리 통합 함수

    Args:
        response: 응답 객체 (단일 또는 리스트 응답)
        request: FastAPI Request 객체
        attach_func: i18n 필드를 추가하는 함수 (예: i18n_service.attach_experiments)
        lang: 언어 코드 (쿼리 파라미터)
        include_i18n: i18n 포함 여부 (쿼리 파라미터)

    Returns:
        i18n 필드가 추가된 응답 객체
    """
    if not include_i18n:
        return response

    target_lang = resolve_target_lang(lang, request.headers.get("accept-language"))
    service = getattr(request.app.state, "translation_service", None)

    if service and service.enabled and should_translate(target_lang):
        attach_func(response, service, target_lang)

    return response


def apply_i18n_to_items(
    items: List[Any],
    request: Request,
    attach_func: Callable,
    lang: Optional[str],
    include_i18n: bool,
) -> List[Any]:
    """
    리스트 아이템에 i18n 처리

    Args:
        items: 아이템 리스트
        request: FastAPI Request 객체
        attach_func: i18n 필드를 추가하는 함수
        lang: 언어 코드
        include_i18n: i18n 포함 여부

    Returns:
        i18n 필드가 추가된 아이템 리스트
    """
    if not include_i18n or not items:
        return items

    target_lang = resolve_target_lang(lang, request.headers.get("accept-language"))
    service = getattr(request.app.state, "translation_service", None)

    if service and service.enabled and should_translate(target_lang):
        attach_func(items, service, target_lang)

    return items
