"""Centralized constants for the backend application."""

# ---------------------------------------------------------------------------
# Chat
# ---------------------------------------------------------------------------
DEFAULT_ROOM_TITLE = "New Chat"
DEFAULT_ROOM_TYPE = "public"

CHAT_STATUS_COMPLETED = "completed"
CHAT_STATUS_FAILED = "failed"

ROLE_USER = "user"
ROLE_ASSISTANT = "assistant"

SENDER_TYPE_GUEST = "guest"
SENDER_TYPE_USER = "user"
SENDER_TYPE_ASSISTANT = "assistant"
SENDER_TYPE_SYSTEM = "system"

DEFAULT_SENDER_NAME = "Guest"
ASSISTANT_SENDER_NAME = "Assistant"
SYSTEM_USER_NAME = "system"

MAX_HISTORY_MESSAGES = 10  # 최대 10개 메시지 (5턴)
MAX_PREVIEW_LENGTH = 200

# ---------------------------------------------------------------------------
# Verification Status (FallEvents)
# ---------------------------------------------------------------------------
VERIFICATION_PENDING = 0
VERIFICATION_CONFIRMED = 1
VERIFICATION_FALSE_ALARM = 2

DEFAULT_VERIFY_SUBJECT = "Agent"

# ---------------------------------------------------------------------------
# Experiment Status
# ---------------------------------------------------------------------------
STATUS_KO_TO_CODE = {
    "진행중": "in_progress",
    "대기": "pending",
    "완료": "completed",
}
DEFAULT_EXPERIMENT_STATUS = "in_progress"

# ---------------------------------------------------------------------------
# NLP Keywords (사고 감지 / 검증 요청 판별)
# ---------------------------------------------------------------------------
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
