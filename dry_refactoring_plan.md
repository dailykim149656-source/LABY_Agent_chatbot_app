# DRY 리팩토링 계획

작성일: 2026-01-31
목표: Don't Repeat Yourself 원칙에 따른 코드 중복 제거

---

## 1) 요약

| 우선순위 | 영역 | 중복 패턴 | 반복 횟수 | 예상 효과 |
|---------|------|----------|----------|----------|
| **P0** | Backend | i18n 라우터 처리 | 10+ | 코드량 50% 감소 |
| **P0** | Backend | i18n 필드 추가 | 10+ | 코드량 60% 감소 |
| **P0** | Frontend | Dialog/AlertDialog | 8+ | 코드량 40% 감소 |
| **P1** | Frontend | 상태 배지 렌더링 | 4+ | 유지보수성 향상 |
| **P1** | Both | 데이터 매핑 로직 | 5+ | 일관성 확보 |
| **P2** | Backend | DB 쿼리 페이지네이션 | 2+ | 확장성 향상 |
| **P2** | Backend | 에러 처리 | 10+ | 코드량 30% 감소 |
| **P3** | Frontend | API 쿼리 빌딩 | 3+ | 코드량 10% 감소 |

---

## 2) P0: 최우선 리팩토링

### 2.1 Backend - i18n 라우터 처리 통합

**현재 문제:**
```python
# 모든 라우터에서 반복되는 패턴
if includeI18n:
    target_lang = resolve_target_lang(lang, request.headers.get("accept-language"))
    service = getattr(request.app.state, "translation_service", None)
    if service and service.enabled and should_translate(target_lang):
        i18n_service.attach_experiments(response, service, target_lang)
```

**리팩토링 계획:**

```
backend/
├── utils/
│   └── i18n_handler.py    # 신규
```

```python
# backend/utils/i18n_handler.py
from typing import Callable, TypeVar, Optional
from fastapi import Request

T = TypeVar("T")

def apply_i18n(
    response: T,
    request: Request,
    attach_func: Callable,
    lang: Optional[str],
    include_i18n: bool
) -> T:
    """i18n 처리 통합 함수"""
    if not include_i18n:
        return response

    target_lang = resolve_target_lang(lang, request.headers.get("accept-language"))
    service = getattr(request.app.state, "translation_service", None)

    if service and service.enabled and should_translate(target_lang):
        attach_func(response, service, target_lang)

    return response
```

**사용 예시:**
```python
# before
if includeI18n:
    target_lang = resolve_target_lang(lang, request.headers.get("accept-language"))
    service = getattr(request.app.state, "translation_service", None)
    if service and service.enabled and should_translate(target_lang):
        i18n_service.attach_experiment_list(response.items, service, target_lang)
return response

# after
return apply_i18n(response, request, i18n_service.attach_experiment_list, lang, includeI18n)
```

**영향 파일:**
- `routers/experiments.py`
- `routers/reagents.py`
- `routers/logs.py`
- `routers/chat_rooms.py`
- `routers/accidents.py`

---

### 2.2 Backend - i18n 필드 추가 제너릭화

**현재 문제:**
```python
# 각 엔티티별로 비슷한 코드 반복
def attach_experiment_list(items, service, target_lang):
    mapping = _translate_map(service, [item.title for item in items], target_lang)
    for item in items:
        if item.title:
            item.titleI18n = mapping.get(item.title)
    return items

def attach_reagent_list(items, service, target_lang):
    texts = []
    for item in items:
        if item.name:
            texts.append(item.name)
        if item.location:
            texts.append(item.location)
    mapping = _translate_map(service, texts, target_lang)
    for item in items:
        if item.name:
            item.nameI18n = mapping.get(item.name)
        if item.location:
            item.locationI18n = mapping.get(item.location)
    return items
```

**리팩토링 계획:**

```python
# backend/services/i18n_service.py 수정
from typing import List, Any

def attach_translations(
    items: List[Any],
    service: TranslationService,
    target_lang: str,
    fields: List[str]
) -> List[Any]:
    """
    제너릭 i18n 필드 추가 함수

    Args:
        items: 번역할 아이템 리스트
        fields: 번역할 필드명 리스트 (예: ["title", "name", "location"])
    """
    # 모든 텍스트 수집
    texts = []
    for item in items:
        for field in fields:
            value = getattr(item, field, None)
            if value:
                texts.append(value)

    # 일괄 번역
    mapping = _translate_map(service, texts, target_lang)

    # i18n 필드 할당
    for item in items:
        for field in fields:
            value = getattr(item, field, None)
            if value:
                setattr(item, f"{field}I18n", mapping.get(value))

    return items

# 기존 함수들을 래퍼로 유지 (하위 호환)
def attach_experiment_list(items, service, target_lang):
    return attach_translations(items, service, target_lang, ["title"])

def attach_reagent_list(items, service, target_lang):
    return attach_translations(items, service, target_lang, ["name", "location"])
```

---

### 2.3 Frontend - ConfirmDialog 컴포넌트

**현재 문제:**
```tsx
// reagents-view.tsx, experiments-view.tsx 등에서 반복
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="ghost" size="icon">
      <Trash2 className="size-4" />
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>{uiText.reagentsDisposeTitle}</AlertDialogTitle>
      <AlertDialogDescription>
        {uiText.reagentsDisposeDescription.replace("{name}", r.name)}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>{uiText.actionCancel}</AlertDialogCancel>
      <AlertDialogAction onClick={() => disposeReagent(r.id)}>
        {uiText.reagentsDisposeConfirm}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**리팩토링 계획:**

```
chemical-sample-dashboard/
├── components/
│   └── ui/
│       └── confirm-dialog.tsx    # 신규
```

```tsx
// components/ui/confirm-dialog.tsx
"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

interface ConfirmDialogProps {
  trigger: React.ReactNode
  title: string
  description: string
  confirmText: string
  cancelText: string
  onConfirm: () => void
  variant?: "default" | "destructive"
}

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmText,
  cancelText,
  onConfirm,
  variant = "default",
}: ConfirmDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={variant === "destructive" ? "bg-destructive" : ""}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

**사용 예시:**
```tsx
// before: 20줄
<AlertDialog>...</AlertDialog>

// after: 8줄
<ConfirmDialog
  trigger={<Button variant="ghost" size="icon"><Trash2 /></Button>}
  title={uiText.reagentsDisposeTitle}
  description={uiText.reagentsDisposeDescription.replace("{name}", r.name)}
  confirmText={uiText.reagentsDisposeConfirm}
  cancelText={uiText.actionCancel}
  onConfirm={() => disposeReagent(r.id)}
  variant="destructive"
/>
```

---

## 3) P1: 중요 리팩토링

### 3.1 Frontend - 상태 배지 유틸리티

**현재 문제:**
```tsx
// conversation-logs.tsx, email-logs.tsx, accident-status.tsx 등에서 반복
const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return <Badge className="bg-success">완료</Badge>
    case "pending":
      return <Badge className="bg-warning">대기</Badge>
    // ...
  }
}
```

**리팩토링 계획:**

```
chemical-sample-dashboard/
├── lib/
│   └── badge-utils.tsx    # 신규
```

```tsx
// lib/badge-utils.tsx
import { Badge } from "@/components/ui/badge"

type StatusType = "success" | "warning" | "error" | "info" | "default"

const STATUS_STYLES: Record<StatusType, string> = {
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  error: "bg-destructive text-destructive-foreground",
  info: "bg-blue-500 text-white",
  default: "bg-secondary text-secondary-foreground",
}

export function StatusBadge({
  status,
  label,
  type = "default",
}: {
  status: string
  label: string
  type?: StatusType
}) {
  return <Badge className={STATUS_STYLES[type]}>{label}</Badge>
}

// 상태 매핑 설정
export const STATUS_TYPE_MAP: Record<string, StatusType> = {
  completed: "success",
  delivered: "success",
  resolved: "success",
  acknowledged: "info",
  pending: "warning",
  active: "warning",
  failed: "error",
  critical: "error",
}

export function getStatusType(status: string): StatusType {
  return STATUS_TYPE_MAP[status] || "default"
}
```

---

### 3.2 공통 데이터 매핑 유틸리티

**리팩토링 계획:**

```
chemical-sample-dashboard/
├── lib/
│   └── data-utils.ts    # 신규
```

```typescript
// lib/data-utils.ts

/**
 * i18n 필드 우선 선택
 */
export function pickI18n(
  i18nValue?: string | null,
  fallback?: string | null
): string {
  const trimmed = i18nValue?.trim()
  if (trimmed) return trimmed
  return fallback ?? ""
}

/**
 * 밀도 포맷팅
 */
export function formatDensity(value?: number | null): string {
  if (value === undefined || value === null) return "-"
  return `${value}g/cm³`
}

/**
 * 질량 포맷팅
 */
export function formatMass(value?: number | null): string {
  if (value === undefined || value === null) return "-"
  return `${value}g`
}

/**
 * 퍼센트 포맷팅
 */
export function formatPercent(value?: number | null): string {
  if (value === undefined || value === null) return "-"
  return `${value}%`
}

/**
 * 날짜 포맷팅
 */
export function formatDate(value?: string | null): string {
  if (!value) return "-"
  return value.split("T")[0]
}
```

---

## 4) P2: 일반 리팩토링

### 4.1 Backend - 페이지네이션 쿼리 빌더

```python
# backend/utils/query_builder.py
from typing import Optional, Dict, Any, Tuple

def build_paginated_query(
    base_select: str,
    table: str,
    limit: int,
    cursor: Optional[int] = None,
    cursor_field: str = "id",
    order: str = "DESC",
    where_clause: str = ""
) -> Tuple[str, Dict[str, Any]]:
    """
    커서 기반 페이지네이션 쿼리 빌더

    Returns:
        (sql, params) 튜플
    """
    params: Dict[str, Any] = {"limit": limit + 1}  # +1 for nextCursor detection

    sql = f"""
    SELECT TOP (:limit)
        {base_select}
    FROM {table}
    WHERE 1=1
    """

    if where_clause:
        sql += f" AND {where_clause}"

    if cursor is not None:
        sql += f" AND {cursor_field} < :cursor"
        params["cursor"] = cursor

    sql += f" ORDER BY {cursor_field} {order}"

    return sql, params
```

### 4.2 Backend - 에러 핸들링 유틸

```python
# backend/utils/exceptions.py
from fastapi import HTTPException
from typing import TypeVar, Optional

T = TypeVar("T")

def ensure_found(item: Optional[T], entity_name: str = "Item") -> T:
    """아이템이 존재하는지 확인, 없으면 404 발생"""
    if item is None:
        raise HTTPException(status_code=404, detail=f"{entity_name} not found")
    return item

def ensure_valid(condition: bool, message: str, status_code: int = 400) -> None:
    """조건 검증, 실패 시 HTTPException 발생"""
    if not condition:
        raise HTTPException(status_code=status_code, detail=message)
```

---

## 5) P3: 선택적 리팩토링

### 5.1 Frontend - i18n 쿼리 빌더

```typescript
// lib/api.ts에 추가

export function buildI18nParams(
  language: string,
  baseParams?: Record<string, string>
): URLSearchParams {
  const params = new URLSearchParams(baseParams)

  if (language !== "KR") {
    params.set("lang", language)
    params.set("includeI18n", "1")
  }

  return params
}
```

---

## 6) 구현 순서

### Phase 1 (P0) - 1주차
1. `utils/i18n_handler.py` 생성
2. 5개 라우터 i18n 처리 통합
3. `ConfirmDialog` 컴포넌트 생성
4. `reagents-view.tsx`, `experiments-view.tsx` 적용

### Phase 2 (P1) - 2주차
1. `lib/badge-utils.tsx` 생성
2. 로그/사고 컴포넌트 적용
3. `lib/data-utils.ts` 생성
4. 훅들에서 공통 함수 사용

### Phase 3 (P2) - 3주차
1. `utils/query_builder.py` 생성
2. `utils/exceptions.py` 생성
3. 레포지토리/라우터 적용

### Phase 4 (P3) - 선택
1. API 쿼리 빌더 통합
2. 추가 최적화

---

## 7) 예상 효과

| 지표 | Before | After | 개선율 |
|------|--------|-------|-------|
| Frontend 코드량 | ~3,500줄 | ~2,800줄 | -20% |
| Backend 코드량 | ~2,000줄 | ~1,600줄 | -20% |
| 중복 패턴 수 | 40+ | 10 이하 | -75% |
| 새 엔티티 추가 시간 | 2시간 | 30분 | -75% |
