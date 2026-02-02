from datetime import datetime, date
from typing import Optional, Literal, List
from pydantic import BaseModel, Field

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    session_id: Optional[str] = None
    user: Optional[str] = None
    lang: Optional[str] = None

class ChatResponse(BaseModel):
    output: str
    outputI18n: Optional[str] = None

class AccidentResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    titleI18n: Optional[str] = None
    descriptionI18n: Optional[str] = None
    locationI18n: Optional[str] = None
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
    incidentTypeI18n: Optional[str] = None
    deliveryStatus: Literal["delivered", "pending", "failed"]

class ConversationLogResponse(BaseModel):
    id: int
    timestamp: datetime
    user: str
    command: str
    commandI18n: Optional[str] = None
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
# Experiments (변경 없음)
# ----------------------
ExperimentStatus = Literal["진행중", "대기", "완료"]

class Quantity(BaseModel):
    value: float
    unit: str

class ExperimentSummary(BaseModel):
    id: str
    title: str
    date: Optional[str] = None
    status: ExperimentStatus
    researcher: Optional[str] = None
    titleI18n: Optional[str] = None

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
    nameI18n: Optional[str] = None
    locationI18n: Optional[str] = None

class ExperimentDetail(BaseModel):
    id: str
    title: str
    date: Optional[str] = None
    status: ExperimentStatus
    researcher: Optional[str] = None
    memo: Optional[str] = None
    memoI18n: Optional[str] = None
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
# Reagents (시약 관련 수정 섹션)
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
    nameI18n: Optional[str] = None
    locationI18n: Optional[str] = None

class ReagentListResponse(BaseModel):
    items: List[ReagentItem]
    nextCursor: Optional[str] = None

# [집중 수정] 시약 추가 시 소라님이 요청하신 10가지 필드 반영
class ReagentCreateRequest(BaseModel):
    reagent_name: str
    formula: Optional[str] = None
    purchase_date: str           # YYYY-MM-DD 형식의 문자열
    current_volume: float        # 현재 용량 값
    total_capacity: float        # 전체 용량 값
    purity: Optional[float] = None
    location: str
    density: Optional[float] = None
    mass: Optional[float] = None
    # open_date는 추가 시 공백이므로 제외, recorded_at은 DB에서 자동 생성

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
    nameI18n: Optional[str] = None
    reasonI18n: Optional[str] = None

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
# Monitoring (변경 없음)
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
    titleI18n: Optional[str] = None
    lastMessagePreviewI18n: Optional[str] = None


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
    contentI18n: Optional[str] = None


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
