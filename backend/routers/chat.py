# -*- coding: utf-8 -*-
from fastapi import APIRouter, HTTPException, Request
from starlette.concurrency import run_in_threadpool

from ..schemas import ChatRequest, ChatResponse
from ..repositories import chat_logs_repo
from ..utils.translation import resolve_target_lang, should_translate

router = APIRouter()


@router.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, request: Request) -> ChatResponse:
    agent = getattr(request.app.state, "agent_executor", None)
    if agent is None:
        raise HTTPException(status_code=500, detail="Agent not initialized")

    engine = request.app.state.db_engine
    user_name = req.user or "system"
    status = "completed"
    output = ""
    try:
        result = await run_in_threadpool(agent.invoke, {"input": req.message})
        output = result.get("output", "")
    except Exception as exc:
        status = "failed"
        output = "Agent error"
        chat_logs_repo.insert_chat_log(engine, user_name, req.message, status)
        raise HTTPException(status_code=500, detail=str(exc))

    chat_logs_repo.insert_chat_log(engine, user_name, req.message, status)

    response = ChatResponse(output=output)
    target_lang = resolve_target_lang(req.lang, request.headers.get("accept-language"))
    service = getattr(request.app.state, "translation_service", None)
    if service and service.enabled and should_translate(target_lang):
        translated = service.translate_texts([output], target_lang)
        response.outputI18n = translated[0] if translated else None
    return response
