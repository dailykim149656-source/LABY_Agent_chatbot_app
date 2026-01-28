# -*- coding: utf-8 -*-
from fastapi import APIRouter, HTTPException, Request
from sqlalchemy import text
from starlette.concurrency import run_in_threadpool

from ..schemas import ChatRequest, ChatResponse

router = APIRouter()

RECENT_KEYWORDS = ("가장 최근", "최근", "최신")
ACCIDENT_KEYWORDS = (
    "사고",
    "넘어짐",
    "전도",
    "쓰러짐",
    "낙상",
    "fall",
    "overturn",
    "tip",
    "upset",
)
VERIFY_KEYWORDS = (
    "확인 처리",
    "확인처리",
    "승인",
    "확인해",
    "확인해줘",
    "확인해 줘",
    "확인 처리해",
    "확인 처리해줘",
    "확인 처리해 줘",
)
REJECT_KEYWORDS = ("오탐", "오류", "거짓", "무효", "거절", "false", "glitch")


def is_recent_accident_query(message: str) -> bool:
    if not message:
        return False
    lower = message.lower()
    has_recent = any(k in message for k in RECENT_KEYWORDS)
    has_accident = any(k in message for k in ACCIDENT_KEYWORDS) or any(
        k in lower for k in ACCIDENT_KEYWORDS
    )
    return has_recent and has_accident


def wants_verify(message: str) -> bool:
    if not message:
        return False
    lower = message.lower()
    return any(k in message for k in VERIFY_KEYWORDS) or any(k in lower for k in VERIFY_KEYWORDS)


def wants_reject(message: str) -> bool:
    if not message:
        return False
    lower = message.lower()
    return any(k in message for k in REJECT_KEYWORDS) or any(k in lower for k in REJECT_KEYWORDS)


def fetch_latest_unverified(engine) -> dict | None:
    sql = """
    SELECT TOP 1 EventID, Timestamp, CameraID, RiskAngle, Status, ExperimentID
    FROM FallEvents
    WHERE VerificationStatus = 0
    ORDER BY Timestamp DESC;
    """
    with engine.connect() as conn:
        return conn.execute(text(sql)).mappings().first()


def format_recent_accident(row: dict) -> str:
    return (
        "가장 최근의 미확인 사고는 다음과 같습니다:\n"
        f"- 이벤트 ID: {row.get('EventID')}\n"
        f"- 발생 시간: {row.get('Timestamp')}\n"
        f"- 카메라: {row.get('CameraID')}\n"
        f"- 위험 각도: {row.get('RiskAngle')}\n"
        f"- 상태: {row.get('Status')}\n"
        f"- 연관 실험 ID: {row.get('ExperimentID')}"
    )


@router.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, request: Request) -> ChatResponse:
    agent = getattr(request.app.state, "agent_executor", None)
    if agent is None:
        raise HTTPException(status_code=500, detail="Agent not initialized")

    engine = request.app.state.db_engine
    status = "completed"
    output = ""

    if is_recent_accident_query(req.message):
        row = fetch_latest_unverified(engine)
        if not row:
            output = "미확인 사고가 없습니다."
        else:
            if wants_verify(req.message):
                with engine.begin() as conn:
                    conn.execute(
                        text(
                            """
                            UPDATE FallEvents
                            SET VerificationStatus = 1,
                                VerifiedAt = GETDATE(),
                                VerifySubject = :subj
                            WHERE EventID = :eid;
                            """
                        ),
                        {"eid": row.get("EventID"), "subj": req.user or "Agent"},
                    )
                output = f"가장 최근의 사고(EventID: {row.get('EventID')})가 확인 처리되었습니다."
            elif wants_reject(req.message):
                with engine.begin() as conn:
                    conn.execute(
                        text(
                            """
                            UPDATE FallEvents
                            SET VerificationStatus = 2,
                                VerifiedAt = GETDATE(),
                                VerifySubject = :subj
                            WHERE EventID = :eid;
                            """
                        ),
                        {"eid": row.get("EventID"), "subj": req.user or "Agent"},
                    )
                output = f"가장 최근의 사고(EventID: {row.get('EventID')})를 오탐으로 처리했습니다."
            else:
                output = format_recent_accident(row)

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

        return ChatResponse(output=output)

    try:
        result = await run_in_threadpool(agent.invoke, {"input": req.message})
        output = result.get("output", "")
    except Exception as exc:
        status = "failed"
        output = "Agent error"

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

    return ChatResponse(output=output)
