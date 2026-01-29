# -*- coding: utf-8 -*-
from fastapi import APIRouter, HTTPException, Request
from sqlalchemy import text
from starlette.concurrency import run_in_threadpool

from ..schemas import ChatRequest, ChatResponse

router = APIRouter()


@router.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, request: Request) -> ChatResponse:
    agent = getattr(request.app.state, "agent_executor", None)
    if agent is None:
        raise HTTPException(status_code=500, detail="Agent not initialized")

    engine = request.app.state.db_engine
    status = "completed"
    output = ""
    try:
        result = await run_in_threadpool(agent.invoke, {"input": req.message})
        output = result.get("output", "")
    except Exception as exc:
        status = "failed"
        output = "Agent error"

        # Log failure
        with engine.begin() as conn:
            conn.execute(
                text(
                    """
                    INSERT INTO ChatLogs (user_name, command, status)
                    VALUES (:user_name, :command, :status);
                    """
                ),
                {
                    "user_name": req.user or "system",
                    "command": req.message,
                    "status": status,
                },
            )

        raise HTTPException(status_code=500, detail=str(exc))

    # Log success
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                INSERT INTO ChatLogs (user_name, command, status)
                VALUES (:user_name, :command, :status);
                """
            ),
            {
                "user_name": req.user or "system",
                "command": req.message,
                "status": status,
            },
        )

    return ChatResponse(
        output=output,
    )
