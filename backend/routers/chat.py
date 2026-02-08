# -*- coding: utf-8 -*-
from fastapi import APIRouter, HTTPException, Request

from ..schemas import ChatRequest, ChatResponse
from ..services import chat_service

router = APIRouter()


@router.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, request: Request) -> ChatResponse:
    agent = getattr(request.app.state, "agent_executor", None)
    if agent is None:
        raise HTTPException(status_code=500, detail="Agent not initialized")

    engine = request.app.state.db_engine
    try:
        output, _status = await chat_service.invoke_agent(engine, agent, req.message, req.user)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    response = ChatResponse(output=output)
    service = getattr(request.app.state, "translation_service", None)
    response.outputI18n = chat_service.translate_output(
        service, output, req.lang, request.headers.get("accept-language")
    )
    return response
