# LABY Agent Chatbot API Contract (Draft v0.1)

작성일: 2026-01-28
수정일: 2026-02-04
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
- `AuthEventType`: `login | logout`

### Chat
- `ChatRoomType`: `public | private`
- `ChatMessageRole`: `user | assistant | system`
- `ChatSenderType`: `guest | user | assistant | system`

### Experiments
- `ExperimentStatus`: `in_progress | completed | pending`

### Reagents
- `ReagentStatus`: `normal | low | expired`
- `StorageStatus`: `normal | warning | critical`

## 4.1 i18n/번역 확장 (추가 규칙)
- **기본 처리 언어**: `ko` (LLM 입력/출력 기준)
- **표시 언어 결정 우선순위**: `lang` 파라미터/필드 > `Accept-Language` 헤더 > 기본 `ko`
- **원문/번역 동시 제공**: 텍스트 필드에 `<field>I18n` 추가
- **언어 코드**: BCP-47 (`ko`, `en`, `ja` 등)
- **응답 i18n 포함 조건**: `includeI18n=1`일 때만 `<field>I18n` 필드를 포함 (기본은 제외)

`LocalizedText` 형식:
```json
{
  "original": "실험 결과 알려줘",
  "originalLang": "ko",
  "normalized": "실험 결과 알려줘",
  "normalizedLang": "ko",
  "display": "Tell me the experiment results",
  "displayLang": "en",
  "translations": {
    "ko": "실험 결과 알려줘",
    "en": "Tell me the experiment results"
  }
}
```
- `original`: 사용자가 보낸 원문
- `normalized`: 내부 처리용(기본 `ko`)
- `display`: 요청 언어로 변환된 표시 문자열
- `translations`: 선택(요청 시) 다국어 캐시

### 적용 필드(우선)
- Chat: `ChatRoom.titleI18n`, `ChatRoom.lastMessagePreviewI18n`, `ChatMessage.contentI18n`
- Logs: `ConversationLog.commandI18n`, `EmailLog.incidentTypeI18n`
- Experiments: `Experiment.titleI18n`, `Experiment.memoI18n`
- Reagents: `Reagent.nameI18n`, `Reagent.locationI18n`

### 번역 제외 필드(기본)
- 화학식/코드/ID (`formula`, `id` 계열)
- 수치/단위 (`quantity`, `volume`, `density` 등)

## 5. 기존 API (As-Is) 계약
### 5.1 Health
`GET /api/health`
```json
{ "status": "ok" }
```
> 변경: 모든 API 인증 적용으로 인해 `/api/health`도 Authorization 헤더가 필요함.

### 5.2 Auth
> 공통: **httpOnly 쿠키 기반 인증** + Authorization 헤더 모두 지원. (signup/login/dev-login 제외)
> 로그인/회원가입/리프레시 응답에서 `Set-Cookie`로 `access_token`, `refresh_token`, `csrf_token` 설정.
> 안전하지 않은 메서드(POST/PATCH/PUT/DELETE)는 `X-CSRF-Token` 헤더 필요 (cookie `csrf_token`과 동일 값).

`POST /api/auth/signup`
> 필수 입력: `email`, `password`, `name`, `affiliation`, `department`, `position`,
> `consent.required`, `consent.iotEnvironment`, `consent.iotReagent`, `consent.video`.
> 선택 입력: `phone`, `contactEmail`, `consent.phone`, `consent.voice`, `consent.marketing`.
Request:
```json
{
  "email": "user@lab.com",
  "password": "password",
  "name": "User Name",
  "affiliation": "OO대학교",
  "department": "화학과",
  "position": "석사과정생",
  "phone": "010-0000-0000",
  "contactEmail": "user.contact@lab.com",
  "consent": {
    "version": "2026-02-04",
    "required": true,
    "phone": false,
    "iotEnvironment": true,
    "iotReagent": true,
    "voice": false,
    "video": true,
    "marketing": false
  }
}
```
Response:
```json
{
  "token_type": "bearer",
  "csrf_token": "csrf-token",
  "user": {
    "id": 1,
    "email": "user@lab.com",
    "name": "User Name",
    "affiliation": "OO대학교",
    "department": "화학과",
    "position": "석사과정생",
    "phone": "010-0000-0000",
    "contactEmail": "user.contact@lab.com",
    "profileImageUrl": "/avatars/avatar-1.png",
    "role": "user",
    "isActive": true,
    "createdAt": "2026-02-04T10:00:00Z",
    "lastLoginAt": "2026-02-04T10:00:00Z"
  }
}
```
> 응답 헤더에 `Set-Cookie: access_token=...; HttpOnly`, `refresh_token=...; HttpOnly`, `csrf_token=...` 포함.

`POST /api/auth/login`
Request:
```json
{ "email": "user@lab.com", "password": "password" }
```
Response: signup과 동일

`GET /api/auth/me`
Response:
```json
{
  "id": 1,
  "email": "user@lab.com",
  "name": "User Name",
  "affiliation": "OO대학교",
  "department": "화학과",
  "position": "석사과정생",
  "phone": "010-0000-0000",
  "contactEmail": "user.contact@lab.com",
  "profileImageUrl": "/avatars/avatar-1.png",
  "role": "user",
  "isActive": true,
  "createdAt": "2026-02-04T10:00:00Z",
  "lastLoginAt": "2026-02-04T10:00:00Z"
}
```

`PATCH /api/auth/me`
Request:
```json
{
  "name": "User Name",
  "affiliation": "OO대학교",
  "department": "화학과",
  "position": "석사과정생",
  "phone": "010-0000-0000",
  "contactEmail": "user.contact@lab.com",
  "profileImageUrl": "/avatars/avatar-1.png"
}
```
Response: `GET /api/auth/me`과 동일

`POST /api/auth/dev-login`
> Dev only: `ALLOW_DEV_LOGIN=1` + `DEV_LOGIN_SECRET` 헤더 필요.

`POST /api/auth/logout`
> refresh token 폐기 + auth 쿠키 삭제.

`DELETE /api/auth/me`
> 회원 탈퇴(영구 삭제). 성공 시 `{ "status": "ok" }` 반환.

`POST /api/auth/refresh`
> refresh token을 사용해 access token 갱신 + csrf_token 재발급.
Response: login과 동일 + `Set-Cookie` 갱신

### 5.2.2 Consent (Admin)
> 관리자 전용 API

`GET /api/consents?limit=50&cursor=123`
Response:
```json
{
  "items": [
    {
      "id": 10,
      "userId": 1,
      "email": "user@lab.com",
      "consentVersion": "2026-02-04",
      "consentPayload": {
        "version": "2026-02-04",
        "required": true,
        "phone": true,
        "iotEnvironment": true,
        "iotReagent": true,
        "voice": true,
        "video": true,
        "marketing": true
      },
      "consentSource": "signup",
      "ipAddress": "127.0.0.1",
      "userAgent": "Mozilla/5.0 ...",
      "createdAt": "2026-02-04T10:00:00Z"
    }
  ],
  "total": 100,
  "nextCursor": 9
}
```

`GET /api/consents/export?limit=1000`
Response: CSV 파일 다운로드

### 5.2.1 User Management (Admin)
> 관리자 전용 API

`GET /api/users?limit=50&cursor=123`
Response:
```json
{
  "items": [
    {
      "id": 1,
      "email": "user@lab.com",
      "name": "User Name",
      "affiliation": "OO대학교",
      "department": "화학과",
      "position": "석사과정생",
      "phone": "010-0000-0000",
      "contactEmail": "user.contact@lab.com",
      "role": "user",
      "isActive": true,
      "createdAt": "2026-02-04T10:00:00Z",
      "lastLoginAt": "2026-02-04T10:00:00Z"
    }
  ],
  "total": 10,
  "nextCursor": "122"
}
```

`GET /api/users/{id}/auth-logs?limit=10`
> 관리자 전용. 최근 로그인/로그아웃 로그 10건 (최신순). 실패 로그인 포함.
Response:
```json
{
  "items": [
    {
      "id": 101,
      "eventType": "login",
      "success": true,
      "loggedAt": "2026-02-04T10:12:00Z",
      "ipAddress": "127.0.0.1",
      "userAgent": "Mozilla/5.0 ..."
    },
    {
      "id": 100,
      "eventType": "login",
      "success": false,
      "loggedAt": "2026-02-04T10:10:00Z",
      "ipAddress": "127.0.0.1",
      "userAgent": "Mozilla/5.0 ..."
    }
  ]
}
```
> `ipAddress`, `userAgent`는 선택 필드이며 저장된 경우에만 반환.

`DELETE /api/users/{id}/auth-logs`
> 관리자 전용. 해당 사용자의 로그인/로그아웃 로그 전체 삭제.
Response:
```json
{ "status": "ok" }
```

`DELETE /api/users/auth-logs`
> 관리자 전용. 모든 사용자 로그인/로그아웃 로그 전체 삭제.
Response:
```json
{ "status": "ok" }
```

`GET /api/export/auth-logs?limit=all`
> 관리자 전용. 모든 사용자 로그인/로그아웃 로그 CSV 다운로드.

`POST /api/users`
> 필수 입력: `email`, `password`, `name`, `affiliation`, `department`, `position`,
> `consent.required`, `consent.iotEnvironment`, `consent.iotReagent`, `consent.video`.
> 선택 입력: `phone`, `contactEmail`, `consent.phone`, `consent.voice`, `consent.marketing`.
Request:
```json
{
  "email": "user@lab.com",
  "password": "password",
  "name": "User Name",
  "role": "user",
  "affiliation": "OO대학교",
  "department": "화학과",
  "position": "석사과정생",
  "phone": "010-0000-0000",
  "contactEmail": "user.contact@lab.com",
  "consent": {
    "version": "2026-02-04",
    "required": true,
    "phone": false,
    "iotEnvironment": true,
    "iotReagent": true,
    "voice": false,
    "video": true,
    "marketing": false
  }
}
```

`PATCH /api/users/{id}`
Request:
```json
{
  "name": "Updated Name",
  "role": "admin",
  "isActive": true,
  "affiliation": "OO대학교",
  "department": "화학과",
  "position": "박사과정생",
  "phone": "010-0000-0000",
  "contactEmail": "user.contact@lab.com"
}
```

`PATCH /api/users/{id}/password`
Request:
```json
{ "password": "NewPass123" }
```
Response:
```json
{ "status": "ok" }
```

`DELETE /api/users/{id}`
Response:
```json
{ "status": "ok" }
```

`DELETE /api/users/{id}/hard`
> 영구 삭제 (관리자 전용). 자기 계정 삭제 불가.
Response:
```json
{ "status": "ok" }
```

### 5.3 Chat
> 표시 언어 지정: `lang`(body/query) 또는 `Accept-Language` 헤더 사용.
`POST /api/chat`
Request:
```json
{ "message": "...", "session_id": "optional", "user": "optional", "lang": "optional" }
```
Response:
```json
{
  "output": "..."
}
```

### 5.3.1 Chat Rooms (Multi-room)
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
> i18n: 응답에 `titleI18n`, `lastMessagePreviewI18n` 포함 가능.

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
      "contentI18n": {
        "original": "안녕",
        "originalLang": "ko",
        "normalized": "안녕",
        "normalizedLang": "ko",
        "display": "Hello",
        "displayLang": "en"
      },
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
  "sender_id": "optional",
  "lang": "optional"
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
> i18n: `userMessage.contentI18n`, `assistantMessage.contentI18n` 포함 가능.

### 5.4 Safety Status
`GET /api/safety/status?limit=3&page=1`
Response:
```json
{
  "environmental": [
    { "key": "temperature", "label": "temperature", "value": "22.4°C", "status": "normal", "recordedAt": "2026-01-28 14:28:00" },
    { "key": "humidity", "label": "humidity", "value": "45%", "status": "normal", "recordedAt": "2026-01-28 14:28:00" }
  ],
  "alerts": [
    { "id": "1", "type": "warning", "message": "...", "location": "...", "time": "2026-01-28T14:28:00Z" }
  ],
  "connections": {
    "cameras": [
      { "id": "Cam-01", "label": "Cam-01", "lastSeen": "2026-01-28T14:28:00Z" }
    ],
    "scales": [
      { "id": "Alpha", "label": "Alpha", "lastSeen": "2026-01-28T14:28:10Z", "status": "Occupied" }
    ]
  },
  "timeBasis": "utc",
  "serverTimeUtc": "2026-01-28T14:29:00Z",
  "serverTimeLocal": "2026-01-28T23:29:00",
  "systemStatus": "normal",
  "totalCount": 42,
  "page": 1,
  "pageSize": 3,
  "totalPages": 9
}
```
> 권장: FE 매칭은 `label`이 아닌 `key` 기반.
> 온/습도는 humid_temp_log 최신 1건 기준이며, `status`는 5분 이내 수집 여부(정상/경고)를 의미.
> `recordedAt`은 DB 로그 시간(초 단위, 소수점 이하 버림).
> 연결 기준: 최근 5분 이내 로그 존재 시 연결로 판단(WeightLog, FallEvents).
> timeBasis: SQL 서버 시간 기준(`GETDATE()`)으로 계산. 추정 로직은 비활성화됨.
> 업데이트 표시는 `serverTimeLocal`(없으면 `serverTimeUtc`) 기반.

### 5.5 Accidents
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

### 5.6 Logs
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
> i18n: 응답에 `commandI18n` 포함 가능.

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
> i18n: 응답에 `incidentTypeI18n` 포함 가능.

### 5.7 Export (CSV)
`GET /api/export/environment?limit=1000|all`
Response: CSV 파일 다운로드
Columns:
```
log_type, recorded_at, temperature, humidity, storage_id, weight_value, status, empty_time
```
Notes:
- `log_type`: `environment` | `scale`
- `recorded_at`: `humid_temp_log.log_time` 또는 `WeightLog.RecordedAt`
- `limit=1000`은 **환경+저울 합산** 상위 1000행 기준

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
> i18n: 응답에 `items[].titleI18n` 포함 가능.

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
> i18n: 응답에 `titleI18n`, `memoI18n`, `reagents[].nameI18n`, `reagents[].locationI18n` 포함 가능.

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
> i18n: 응답에 `items[].nameI18n`, `items[].locationI18n` 포함 가능.

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

