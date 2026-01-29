from datetime import datetime, date
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
    status: Literal["active", "acknowledged", "resolved", "false_alarm"]
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
    status: Optional[str] = None
    verificationStatus: Optional[int] = None
    experimentId: Optional[str] = None


class SafetyStatusResponse(BaseModel):
    environmental: List[SafetyEnvironmentItem]
    alerts: List[SafetyAlert]
    systemStatus: str
    totalCount: Optional[int] = None
    page: Optional[int] = None
    pageSize: Optional[int] = None
    totalPages: Optional[int] = None


# ----------------------
# Experiments
# ----------------------
ExperimentStatus = Literal["in_progress", "completed", "pending"]


class Quantity(BaseModel):
    value: float
    unit: str


class ExperimentSummary(BaseModel):
    id: str
    title: str
    date: Optional[date] = None
    status: ExperimentStatus
    researcher: Optional[str] = None


class ExperimentReagent(BaseModel):
    id: str
    reagentId: str
    name: str
    formula: Optional[str] = None
    dosage: Quantity
    density: Optional[float] = None
    mass: Optional[float] = None
    purity: Optional[float] = None
    location: Optional[str] = None


class ExperimentDetail(BaseModel):
    id: str
    title: str
    date: Optional[date] = None
    status: ExperimentStatus
    researcher: Optional[str] = None
    memo: Optional[str] = None
    reagents: List[ExperimentReagent] = Field(default_factory=list)


class ExperimentListResponse(BaseModel):
    items: List[ExperimentSummary]
    nextCursor: Optional[str] = None


class ExperimentCreateRequest(BaseModel):
    title: str
    researcher: Optional[str] = None
    date: Optional[date] = None
    status: Optional[ExperimentStatus] = "pending"
    memo: Optional[str] = None


class ExperimentUpdateRequest(BaseModel):
    title: Optional[str] = None
    researcher: Optional[str] = None
    date: Optional[date] = None
    status: Optional[ExperimentStatus] = None
    memo: Optional[str] = None


class ExperimentReagentCreateRequest(BaseModel):
    reagentId: str
    dosage: Quantity


# ----------------------
# Reagents
# ----------------------
ReagentStatus = Literal["normal", "low", "expired"]
StorageStatus = Literal["normal", "warning", "critical"]


class ReagentItem(BaseModel):
    id: str
    name: str
    formula: Optional[str] = None
    purchaseDate: Optional[date] = None
    openDate: Optional[date] = None
    currentVolume: Optional[Quantity] = None
    originalVolume: Optional[Quantity] = None
    density: Optional[float] = None
    mass: Optional[float] = None
    purity: Optional[float] = None
    location: Optional[str] = None
    status: ReagentStatus = "normal"


class ReagentListResponse(BaseModel):
    items: List[ReagentItem]
    nextCursor: Optional[str] = None


class ReagentCreateRequest(BaseModel):
    id: Optional[str] = None
    name: str
    formula: str
    purchaseDate: Optional[date] = None
    originalVolume: Quantity
    purity: float
    location: str
    currentVolume: Optional[Quantity] = None
    openDate: Optional[date] = None
    density: Optional[float] = None
    mass: Optional[float] = None
    status: Optional[ReagentStatus] = "normal"


class ReagentUpdateRequest(BaseModel):
    name: Optional[str] = None
    formula: Optional[str] = None
    purchaseDate: Optional[date] = None
    openDate: Optional[date] = None
    currentVolume: Optional[Quantity] = None
    originalVolume: Optional[Quantity] = None
    density: Optional[float] = None
    mass: Optional[float] = None
    purity: Optional[float] = None
    location: Optional[str] = None
    status: Optional[ReagentStatus] = None


class ReagentDisposalCreateRequest(BaseModel):
    reason: str
    disposedBy: str


class ReagentDisposalResponse(BaseModel):
    id: str
    name: str
    formula: Optional[str] = None
    disposalDate: date
    reason: str
    disposedBy: str


class StorageEnvironmentItem(BaseModel):
    location: str
    temp: float
    humidity: float
    status: StorageStatus


class StorageEnvironmentResponse(BaseModel):
    items: List[StorageEnvironmentItem]


class ReagentDisposalListResponse(BaseModel):
    items: List[ReagentDisposalResponse]
    nextCursor: Optional[str] = None


# ----------------------
# Monitoring
# ----------------------
class MonitoringOverviewResponse(BaseModel):
    model: str
    lastUpdated: datetime
    fps: int


# ----------------------
# Chat Rooms
# ----------------------
ChatRoomType = Literal["public", "private"]
ChatMessageRole = Literal["user", "assistant", "system"]
ChatSenderType = Literal["guest", "user", "assistant", "system"]


class ChatRoomResponse(BaseModel):
    id: str
    title: str
    roomType: ChatRoomType
    createdAt: datetime
    lastMessageAt: Optional[datetime] = None
    lastMessagePreview: Optional[str] = None


class ChatRoomListResponse(BaseModel):
    items: List[ChatRoomResponse]
    nextCursor: Optional[str] = None


class ChatRoomCreateRequest(BaseModel):
    title: Optional[str] = None


class ChatRoomUpdateRequest(BaseModel):
    title: Optional[str] = None


class ChatMessageResponse(BaseModel):
    id: str
    roomId: str
    role: ChatMessageRole
    content: str
    createdAt: datetime
    senderType: ChatSenderType
    senderId: Optional[str] = None
    senderName: Optional[str] = None


class ChatMessageListResponse(BaseModel):
    items: List[ChatMessageResponse]
    nextCursor: Optional[str] = None


class ChatMessageCreateRequest(BaseModel):
    message: str = Field(..., min_length=1)
    user: Optional[str] = None
    sender_type: ChatSenderType = "guest"
    sender_id: Optional[str] = None


class ChatMessageCreateResponse(BaseModel):
    roomId: str
    userMessage: ChatMessageResponse
    assistantMessage: ChatMessageResponse
