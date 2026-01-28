from datetime import datetime
from typing import Optional, Literal, List

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    session_id: Optional[str] = None
    user: Optional[str] = None


class ChatResponse(BaseModel):
    output: str


class AccidentResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    severity: Literal["critical", "high", "medium", "low"]
    status: Literal["active", "acknowledged", "resolved"]
    reportedAt: datetime
    reportedBy: str


class AccidentUpdateRequest(BaseModel):
    verification_status: int = Field(..., ge=0, le=2)
    verify_subject: Optional[str] = None


class EmailLogResponse(BaseModel):
    id: int
    sentTime: datetime
    recipient: str
    recipientEmail: str
    incidentType: str
    deliveryStatus: Literal["delivered", "pending", "failed"]


class ConversationLogResponse(BaseModel):
    id: int
    timestamp: datetime
    user: str
    command: str
    status: Literal["completed", "pending", "failed"]


class SafetyEnvironmentItem(BaseModel):
    key: str
    label: str
    value: str
    status: Literal["normal", "warning", "critical"]


class SafetyAlert(BaseModel):
    id: str
    type: Literal["warning", "critical", "info"]
    message: str
    location: str
    time: str


class SafetyStatusResponse(BaseModel):
    environmental: List[SafetyEnvironmentItem]
    alerts: List[SafetyAlert]
    systemStatus: str
