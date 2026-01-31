# Azure Translator 도입 계획 보고서

작성일: 2026-01-31
대상: LABY Agent Chatbot App (backend + chemical-sample-dashboard)
범위: 번역(다국어) 기능의 서버 연동형 도입 계획 정리

---

## 1) 현재 Pain Point
- 하드코딩 UI 문자열 기반이라 동적 데이터(실험명, 메모, 채팅, 로그 등) 번역이 불가
- 언어 추가/수정 시 코드 수정 범위가 커서 유지보수 비용 증가
- API 계약 문서의 i18n 확장 규칙과 실제 구현 사이 괴리 존재
- UX 관점에서 “언어 변경”이 UI 레이블만 바뀌고 콘텐츠는 그대로라 일관성이 떨어짐
- 번역 품질/일관성 개선(용어 통일, 재사용) 위한 캐시/정규화 전략 부재

---

## 2) 구현 계획 (요약)
1. **요구사항/범위 확정**
   - 번역 대상 도메인(채팅/실험/시약/로그/사고 등) 및 대상 언어 확정
   - 번역 시점(요청 시 실시간 vs 캐시 기반) 및 비용 상한 결정

2. **API 계약 업데이트** (`api_contract.md`)
   - `lang`, `includeI18n` 파라미터 정의
   - i18n 응답 필드 규칙 명시 (예: `titleI18n`, `memoI18n`, `contentI18n`)
   - 캐시 키/TTL/무효화 정책 문서화

3. **백엔드 번역 모듈 설계/구현**
   - `translation_service` + `translation_cache_repo` 추가
   - Azure Translator 호출 + 실패 시 fallback + 레이트리밋 처리
   - 캐시 테이블 추가 (Additive 스키마)

4. **도메인 서비스/라우터 연결**
   - `includeI18n=1` 요청 시 필요한 필드에 번역 주입
   - i18n 필드가 있으면 FE에서 우선 사용

5. **프론트 연동**
   - i18n 필드 우선 표시 로직 적용
   - 기존 UI 텍스트(하드코딩) fallback 유지

6. **검증/운영 준비**
   - 캐시 히트율, 비용, 응답 지연 측정
   - 번역 품질/오류 처리/빈값 처리 점검

---

## 3) 예상 구현 기능
- **서버 사이드 번역 제공**
  - API 응답에 `xxxI18n` 필드를 선택적으로 포함

- **번역 캐시**
  - 동일 문구 반복 번역 비용 절감
  - TTL 정책 기반 재번역/갱신

- **도메인별 i18n 확장**
  - Chat: `contentI18n` (메시지)
  - Experiments: `titleI18n`, `memoI18n`, `reagents[].nameI18n`, `reagents[].locationI18n`
  - Reagents: `nameI18n`, `locationI18n`
  - Logs/Accidents: `commandI18n`, `incidentTypeI18n`, `titleI18n`, `descriptionI18n`

- **FE 표기 우선순위**
  - `i18n` 필드 우선, 없으면 원문 사용

---

## 4) 범위 외 (추후 고려)
- 실시간 스트리밍 번역
- 사용자 맞춤 번역 사전/용어집
- 번역 품질 자동 평가/교정

---

## 5) 리스크/주의사항
- 비용 관리: 대량 데이터 번역 시 비용 상승 가능
- 레이트리밋: 동시 요청 폭주 시 응답 지연
- 품질: 과학/실험 용어 번역 품질 이슈 가능
- 캐시 무효화 정책 설계 필요

---

## 6) 비용 추정 (산식/방법)
- **산식(기본)**: `총 문자수(월) ÷ 1,000,000 × (Azure Translator 요금/백만 문자)`
- **총 문자수 추정**:  
  - 도메인별 평균 텍스트 길이 × 요청 건수 × 번역 대상 언어 수  
  - 예: `실험 메모 평균 200자 × 월 10,000건 × 3개 언어`
- **캐시 반영**:  
  - `실제 과금 문자수 = 총 문자수 × (1 - 캐시 히트율)`
- **주의**: 요금은 Azure 최신 요금표 기준으로 산정해야 하며, 지역/플랜에 따라 달라질 수 있음

---

## 7) 캐시 TTL 정책 (초안)
- **정적성 높은 데이터**: 7~30일 (예: 시약명, 위치, 실험 제목)
- **중간 변동 데이터**: 1~7일 (예: 실험 메모, 로그 메시지)
- **실시간성 데이터**: 1~24시간 (예: 채팅 응답)
- **무효화 조건**: 원문 필드 변경 시 즉시 캐시 폐기 (업데이트 훅에서 invalidate)
- **언어별 분리**: `source_hash + target_lang + source_lang + provider` 조합을 키로 캐시

---

## 8) API 예시 스펙 (요약)
요청 파라미터 예시:
```
GET /api/experiments?limit=50&lang=EN&includeI18n=1
GET /api/experiments/EXP-2026-001?lang=JP&includeI18n=1
GET /api/chat/rooms/42/messages?limit=50&lang=CN&includeI18n=1
```

응답 예시(요약):
```
{
  "id": "EXP-2026-001",
  "title": "산화 환원 반응 실험",
  "titleI18n": "Redox Reaction Experiment",
  "memo": "반응 온도 25°C 유지.",
  "memoI18n": "Maintain reaction temperature at 25°C.",
  "reagents": [
    {
      "name": "황산 #1",
      "nameI18n": "Sulfuric Acid #1",
      "location": "캐비닛 A-01",
      "locationI18n": "Cabinet A-01"
    }
  ]
}
```

---

## 9) Open Questions
- 우선 번역 대상 도메인 범위는 어디까지인가?
- 실시간 번역 vs 캐시 기반 번역 중 우선할 전략은?
- 언어 옵션(EN/JP/CN/KR) 외 추가 언어 필요 여부?
- i18n 필드를 “항상 제공” vs “옵션 제공” 중 어떤 정책?

---

## 10) 다음 액션 제안
- `api_contract.md`에 i18n 규칙 선반영
- Translator 모듈 스켈레톤 작성(서비스/레포/캐시)
- FE i18n 필드 우선 표시 로직 적용

---
