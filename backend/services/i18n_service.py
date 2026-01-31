from __future__ import annotations

from typing import Iterable, List, Optional

from ..schemas import (
    AccidentResponse,
    ChatMessageResponse,
    ChatMessageCreateResponse,
    ChatRoomResponse,
    ConversationLogResponse,
    EmailLogResponse,
    ExperimentDetail,
    ExperimentSummary,
    ReagentDisposalResponse,
    ReagentItem,
)
from ..services.translation_service import TranslationService


def _translate_map(
    service: TranslationService,
    texts: Iterable[str],
    target_lang: str,
    source_lang: Optional[str] = None,
) -> dict[str, str]:
    unique: List[str] = []
    seen = set()
    for text in texts:
        if not text:
            continue
        if text in seen:
            continue
        seen.add(text)
        unique.append(text)
    if not unique:
        return {}
    translated = service.translate_texts(unique, target_lang, source_lang)
    return {src: dst for src, dst in zip(unique, translated)}


def attach_experiment_list(
    items: List[ExperimentSummary],
    service: TranslationService,
    target_lang: str,
) -> List[ExperimentSummary]:
    mapping = _translate_map(service, [item.title for item in items], target_lang)
    for item in items:
        if item.title:
            item.titleI18n = mapping.get(item.title)
    return items


def attach_experiment_detail(
    detail: ExperimentDetail,
    service: TranslationService,
    target_lang: str,
) -> ExperimentDetail:
    texts = [detail.title]
    if detail.memo:
        texts.append(detail.memo)
    for reagent in detail.reagents:
        if reagent.name:
            texts.append(reagent.name)
        if reagent.location:
            texts.append(reagent.location)

    mapping = _translate_map(service, texts, target_lang)
    detail.titleI18n = mapping.get(detail.title)
    if detail.memo:
        detail.memoI18n = mapping.get(detail.memo)
    for reagent in detail.reagents:
        if reagent.name:
            reagent.nameI18n = mapping.get(reagent.name)
        if reagent.location:
            reagent.locationI18n = mapping.get(reagent.location)
    return detail


def attach_reagent_list(
    items: List[ReagentItem],
    service: TranslationService,
    target_lang: str,
) -> List[ReagentItem]:
    texts = []
    for item in items:
        if item.name:
            texts.append(item.name)
        if item.location:
            texts.append(item.location)
    mapping = _translate_map(service, texts, target_lang)
    for item in items:
        if item.name:
            item.nameI18n = mapping.get(item.name)
        if item.location:
            item.locationI18n = mapping.get(item.location)
    return items


def attach_reagent_disposals(
    items: List[ReagentDisposalResponse],
    service: TranslationService,
    target_lang: str,
) -> List[ReagentDisposalResponse]:
    texts = []
    for item in items:
        if item.name:
            texts.append(item.name)
        if item.reason:
            texts.append(item.reason)
    mapping = _translate_map(service, texts, target_lang)
    for item in items:
        if item.name:
            item.nameI18n = mapping.get(item.name)
        if item.reason:
            item.reasonI18n = mapping.get(item.reason)
    return items


def attach_chat_rooms(
    items: List[ChatRoomResponse],
    service: TranslationService,
    target_lang: str,
) -> List[ChatRoomResponse]:
    texts = []
    for item in items:
        if item.title:
            texts.append(item.title)
        if item.lastMessagePreview:
            texts.append(item.lastMessagePreview)
    mapping = _translate_map(service, texts, target_lang)
    for item in items:
        if item.title:
            item.titleI18n = mapping.get(item.title)
        if item.lastMessagePreview:
            item.lastMessagePreviewI18n = mapping.get(item.lastMessagePreview)
    return items


def attach_chat_messages(
    items: List[ChatMessageResponse],
    service: TranslationService,
    target_lang: str,
) -> List[ChatMessageResponse]:
    mapping = _translate_map(service, [item.content for item in items], target_lang)
    for item in items:
        if item.content:
            item.contentI18n = mapping.get(item.content)
    return items


def attach_chat_message_pair(
    payload: ChatMessageCreateResponse,
    service: TranslationService,
    target_lang: str,
) -> ChatMessageCreateResponse:
    messages = [payload.userMessage, payload.assistantMessage]
    attach_chat_messages(messages, service, target_lang)
    return payload


def attach_conversation_logs(
    items: List[ConversationLogResponse],
    service: TranslationService,
    target_lang: str,
) -> List[ConversationLogResponse]:
    mapping = _translate_map(service, [item.command for item in items], target_lang)
    for item in items:
        if item.command:
            item.commandI18n = mapping.get(item.command)
    return items


def attach_email_logs(
    items: List[EmailLogResponse],
    service: TranslationService,
    target_lang: str,
) -> List[EmailLogResponse]:
    mapping = _translate_map(service, [item.incidentType for item in items], target_lang)
    for item in items:
        if item.incidentType:
            item.incidentTypeI18n = mapping.get(item.incidentType)
    return items


def attach_accidents(
    items: List[AccidentResponse],
    service: TranslationService,
    target_lang: str,
) -> List[AccidentResponse]:
    texts = []
    for item in items:
        if item.title:
            texts.append(item.title)
        if item.description:
            texts.append(item.description)
        if item.location:
            texts.append(item.location)
    mapping = _translate_map(service, texts, target_lang)
    for item in items:
        if item.title:
            item.titleI18n = mapping.get(item.title)
        if item.description:
            item.descriptionI18n = mapping.get(item.description)
        if item.location:
            item.locationI18n = mapping.get(item.location)
    return items
