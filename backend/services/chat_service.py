"""Service layer for the simple /api/chat endpoint."""

from typing import Optional

from starlette.concurrency import run_in_threadpool

from ..repositories import chat_logs_repo
from ..utils.constants import CHAT_STATUS_COMPLETED, CHAT_STATUS_FAILED, SYSTEM_USER_NAME
from ..utils.translation import resolve_target_lang, should_translate


async def invoke_agent(engine, agent, message: str, user_name: Optional[str]) -> tuple:
    """Run the agent and log the result. Returns (output, status)."""
    status = CHAT_STATUS_COMPLETED
    try:
        result = await run_in_threadpool(agent.invoke, {"input": message})
        output = result.get("output", "")
    except Exception as exc:
        status = CHAT_STATUS_FAILED
        chat_logs_repo.insert_chat_log(engine, user_name or SYSTEM_USER_NAME, message, status)
        raise exc

    chat_logs_repo.insert_chat_log(engine, user_name or SYSTEM_USER_NAME, message, status)
    return output, status


def translate_output(service, output: str, lang: Optional[str], accept_language: Optional[str]) -> Optional[str]:
    """Translate a single output string if applicable."""
    target_lang = resolve_target_lang(lang, accept_language)
    if service and service.enabled and should_translate(target_lang):
        translated = service.translate_texts([output], target_lang)
        return translated[0] if translated else None
    return None
