# LABY Agent Chatbot API Contract (Draft v0.1)

작성일: 2026-01-28
범위: 현재 구현된 API + 실험/시약/모니터링 확장을 위한 목표 계약

## 1. 설계 원칙 (충돌 방지/확장성)
- **JSON + UTF-8**
- **키 네이밍**: camelCase 권장. 기존 snake_case는 하위 호환 유지.
- **날짜/시간**: ISO 8601 문자열 (예: `2026-01-28T14:28:00Z`)
- **ID 타입**: 문자열 권장(숫자도 허용). FE는 문자열로 처리.
- **라벨/문구**: API는 **코드값**을 제공, UI 라벨은 FE에서 매핑.
- **에러 포맷 표준화**: 아래 공통 에러 형식 사용.
- **확장 대비**: 리스트 응답은 `items` + `nextCursor` 형식 권장 (기존 배열 응답은 호환 유지).

## 2. 공통 에러 포맷
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": { "field": "message" },
    "traceId": "req-20260128-abcdef"
  }
}
```
- `code`: ENUM (VALIDATION_ERROR, NOT_FOUND, CONFLICT, INTERNAL_ERROR)
- `message`: 사용자/개발자 메시지
- `details`: 옵션 (필드별 오류, 추가 정보)
- `traceId`: 요청 추적 ID (선택)

## 3. 공통 페이지네이션
- Query: `limit`, `cursor`
- Response: `items` + `nextCursor` (권장)
- **하위 호환**: 기존 엔드포인트는 배열만 반환 가능. 이 경우 `X-Next-Cursor` 헤더 사용.

## 4. 공통 ENUM 정의
### Accident
- `AccidentSeverity`: `critical | high | medium | low`
- `AccidentStatus`: `active | acknowledged | resolved | false_alarm`
- `AccidentReviewStatus`: `0(pending) | 1(confirmed) | 2(false_alarm)`

결정: `verification_status` 의미
- `0` = 확인되지 않음
- `1` = 실제 사고 승인
- `2` = 오류(오탐)로 판단

권장 매핑
- `verification_status=0` -> `status=active`
- `verification_status=1` -> `status=acknowledged`
- `verification_status=2` -> `status=false_alarm`
- `status=resolved`는 별도 해소 처리 시 사용(추후 필드 확장)

### Safety
- `SafetyAlertType`: `info | warning | critical`
- `SafetyEnvStatus`: `normal | warning | critical`
- `SystemStatus`: `normal | degraded | down`
- `SafetyAlert` fields: `id`, `type`, `message`, `location`, `time`, `status?`, `verificationStatus?`, `experimentId?`

### Logs
- `ConversationLogStatus`: `completed | pending | failed`
- `EmailDeliveryStatus`: `delivered | pending | failed`

### Chat
- `ChatRoomType`: `public | private`
- `ChatMessageRole`: `user | assistant | system`
- `ChatSenderType`: `guest | user | assistant | system`

### Experiments
- `ExperimentStatus`: `in_progress | completed | pending`

### Reagents
- `ReagentStatus`: `normal | low | expired`
- `StorageStatus`: `normal | warning | critical`

## 5. 기존 API (As-Is) 계약
### 5.1 Health
`GET /api/health`
```json
{ "status": "ok" }
```

### 5.2 Chat
`POST /api/chat`
Request:
```json
{ "message": "...", "session_id": "optional", "user": "optional" }
```
Response:
```json
{ "output": "..." }
```

### 5.2.1 Chat Rooms (Multi-room)
`POST /api/chat/rooms`
Request:
```json
{ "title": "optional" }
```
Response:
```json
{
  "id": "1",
  "title": "New Chat",
  "roomType": "public",
  "createdAt": "2026-01-28T14:28:00Z",
  "lastMessageAt": null,
  "lastMessagePreview": null
}
```

`GET /api/chat/rooms?limit=50&cursor=123`
Response:
```json
{
  "items": [
    {
      "id": "1",
      "title": "New Chat",
      "roomType": "public",
      "createdAt": "2026-01-28T14:28:00Z",
      "lastMessageAt": "2026-01-28T14:30:00Z",
      "lastMessagePreview": "Latest message preview"
    }
  ],
  "nextCursor": "122"
}
```

`GET /api/chat/rooms/{roomId}`
Response: `ChatRoom` 동일

`PATCH /api/chat/rooms/{roomId}`
Request:
```json
{ "title": "Renamed Chat" }
```
Response: `ChatRoom` 동일

`DELETE /api/chat/rooms/{roomId}`
Response:
```json
{ "status": "deleted" }
```

`GET /api/chat/rooms/{roomId}/messages?limit=50&cursor=200`
Response:
```json
{
  "items": [
    {
      "id": "1",
      "roomId": "1",
      "role": "user",
      "content": "Hello",
      "createdAt": "2026-01-28T14:31:00Z",
      "senderType": "guest",
      "senderId": null,
      "senderName": "Guest"
    }
  ],
  "nextCursor": "198"
}
```

`POST /api/chat/rooms/{roomId}/messages`
Request:
```json
{
  "message": "Hello",
  "user": "optional",
  "sender_type": "guest",
  "sender_id": "optional"
}
```
Response:
```json
{
  "roomId": "1",
  "userMessage": { "id": "10", "roomId": "1", "role": "user", "content": "...", "createdAt": "...", "senderType": "guest", "senderId": null, "senderName": "Guest" },
  "assistantMessage": { "id": "11", "roomId": "1", "role": "assistant", "content": "...", "createdAt": "...", "senderType": "assistant", "senderId": null, "senderName": "Assistant" }
}
```

### 5.3 Safety Status
`GET /api/safety/status?limit=3&page=1`
Response:
```json
{
  "environmental": [
    { "key": "temperature", "label": "temperature", "value": "22.4", "status": "normal" }
  ],
  "alerts": [
    { "id": "1", "type": "warning", "message": "...", "location": "...", "time": "2026-01-28T14:28:00Z" }
  ],
  "systemStatus": "normal",
  "totalCount": 42,
  "page": 1,
  "pageSize": 3,
  "totalPages": 9
}
```
> 권장: FE 매칭은 `label`이 아닌 `key` 기반.

### 5.4 Accidents
`GET /api/accidents?status=active&from_ts=...&to_ts=...&limit=100`
Response (현재는 배열):
```json
[
  {
    "id": 123,
    "title": "...",
    "description": "...",
    "location": "...",
    "severity": "high",
    "status": "active",
    "reportedAt": "2026-01-28T14:28:00Z",
    "reportedBy": "system"
  }
]
```

`PATCH /api/accidents/{id}`
Request:
```json
{ "verification_status": 1, "verify_subject": "ui" }
```
Response: `Accident` 동일

### 5.5 Logs
`GET /api/logs/conversations?limit=100`
Response (배열):
```json
[
  {
    "id": 1,
    "timestamp": "2026-01-28T14:32:15Z",
    "user": "kim",
    "command": "...",
    "status": "completed"
  }
]
```

`GET /api/logs/emails?limit=100`
```json
[
  {
    "id": 1,
    "sentTime": "2026-01-28T14:30:00Z",
    "recipient": "...",
    "recipientEmail": "...",
    "incidentType": "...",
    "deliveryStatus": "delivered"
  }
]
```

## 6. 확장 API (To-Be) 계약
### 6.1 Experiments
`GET /api/experiments?limit=50&cursor=...`
```json
{
  "items": [
    {
      "id": "EXP-2026-001",
      "title": "...",
      "date": "2026-01-28",
      "status": "in_progress",
      "researcher": "..."
    }
  ],
  "nextCursor": "..."
}
```

`GET /api/experiments/{id}`
```json
{
  "id": "EXP-2026-001",
  "title": "...",
  "date": "2026-01-28",
  "status": "in_progress",
  "researcher": "...",
  "memo": "...",
  "reagents": [
    {
      "id": "ER-001",
      "reagentId": "H2SO4-001",
      "name": "...",
      "formula": "H2SO4",
      "dosage": { "value": 50, "unit": "ml" },
      "density": 1.84,
      "mass": 828,
      "purity": 98,
      "location": "..."
    }
  ]
}
```

`POST /api/experiments`
```json
{ "title": "...", "researcher": "...", "date": "2026-01-28", "status": "pending" }
```

`PATCH /api/experiments/{id}`
```json
{ "title": "...", "status": "completed", "memo": "..." }
```

`POST /api/experiments/{id}/reagents`
```json
{ "reagentId": "H2SO4-001", "dosage": { "value": 50, "unit": "ml" } }
```

`DELETE /api/experiments/{id}/reagents/{experimentReagentId}`

### 6.2 Reagents
`GET /api/reagents?limit=100&cursor=...`
```json
{
  "items": [
    {
      "id": "H2SO4-001",
      "name": "...",
      "formula": "H2SO4",
      "purchaseDate": "2025-12-15",
      "openDate": "2026-01-10",
      "currentVolume": { "value": 450, "unit": "ml" },
      "originalVolume": { "value": 500, "unit": "ml" },
      "density": 1.84,
      "mass": 828,
      "purity": 98,
      "location": "A-01",
      "status": "normal"
    }
  ],
  "nextCursor": "..."
}
```

`POST /api/reagents`
```json
{ "name": "...", "formula": "H2SO4", "purchaseDate": "2026-01-28", "originalVolume": { "value": 500, "unit": "ml" }, "purity": 98, "location": "A-01" }
```

`PATCH /api/reagents/{id}`
```json
{ "currentVolume": { "value": 450, "unit": "ml" }, "status": "low" }
```

`POST /api/reagents/{id}/dispose`
```json
{ "reason": "expired", "disposedBy": "admin" }
```

`GET /api/reagents/disposals?limit=100&cursor=...`
```json
{
  "items": [
    { "id": "HNO3-001", "name": "...", "formula": "HNO3", "disposalDate": "2026-01-25", "reason": "expired", "disposedBy": "kim" }
  ],
  "nextCursor": "..."
}
```

`GET /api/reagents/storage-environment`
```json
{
  "items": [
    { "location": "Cabinet A", "temp": 22.0, "humidity": 42, "status": "normal" }
  ]
}
```

### 6.3 Monitoring (선택)
`GET /api/monitoring/overview`
```json
{ "model": "Lab-3D", "lastUpdated": "2026-01-28T14:00:00Z", "fps": 60 }
```

## 7. 호환/마이그레이션 가이드
- 기존 FE 더미 데이터는 **코드값(enum)** 으로 변환 후 표시 레이어에서 한글 라벨 매핑.
- Safety 환경 매칭은 `label`이 아닌 **`key`** 기준.
- 사고 검증 상태는 `verification_status`(숫자) + `status`(문자열)로 분리 권장.
- 수량/단위는 **객체형(`{ value, unit }`)을 기본**으로 하고, 기존 문자열은 호환 처리.

## 8. 결정 사항 (확정)
1) `verification_status`: 0 미확인, 1 실제 사고 승인, 2 오류(오탐)
2) 실험 상태값은 `in_progress / completed / pending`으로 통일
3) 수량/단위는 객체형(`{ value, unit }`)을 기본으로 하고 문자열 호환 유지
4) 신규 리스트 응답은 `items + nextCursor`, 기존 엔드포인트 배열은 유지 + `X-Next-Cursor` 헤더 사용

