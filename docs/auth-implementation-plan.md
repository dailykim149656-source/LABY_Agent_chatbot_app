# 로그인 및 사용자 관리 기능 구현 계획

> 최종 업데이트: 2026-02-04

## 개요
- **목표**: JWT 기반 로그인/회원가입, 관리자/사용자 역할 구분, 사용자 관리 탭 추가
- **Capacitor 호환**: localStorage 추상화로 추후 네이티브 앱 포팅 용이하게 설계
- **개발 편의**: Dev Bypass 로그인으로 개발 중 빠른 테스트 지원

---

## 주요 결정사항

| 항목 | 결정 |
|------|------|
| 토큰 방식 | Access Token만 사용 (Refresh Token 없음) |
| 토큰 TTL | 8시간 (480분) |
| 로그인 키 | email (username 대신) |
| 테스트 관리자 | msu@msu.lab.kr / 1234 |
| API 보호 | 모든 API 인증 필요 (/api/auth/* 제외) |

---

## 아키텍처

```
[Frontend - Next.js SSG]          [Backend - FastAPI]
         |                                |
    로그인/회원가입 폼                      |
         |----POST /api/auth/signup-----> 사용자 생성
         |----POST /api/auth/login------> 인증 검증
         |                                |
    JWT 토큰 저장 <-- accessToken -------- JWT 발급
    (localStorage)                        |
         |                                |
    API 요청 + Bearer Token -----------> 토큰 검증 (Depends)
         |                                |
    역할 기반 UI <--- user.role --------- 사용자 정보 반환
```

---

## 환경 변수

### Backend (azure_and_sql.env)
```env
# JWT 설정
JWT_SECRET_KEY=your-secure-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=480

# 개발/테스트 설정
ALLOW_DEV_LOGIN=1
SEED_TEST_USERS=1
TEST_USER_EMAIL=msu@msu.lab.kr
TEST_USER_PASSWORD=1234
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_ALLOW_DEV_BYPASS=1
```

---

## 구현 파일 목록

### Backend (신규 파일)
| 파일 | 설명 |
|------|------|
| `backend/utils/security.py` | JWT 생성/검증, bcrypt 해싱 |
| `backend/utils/dependencies.py` | FastAPI 인증 미들웨어 (get_current_user, require_admin) |
| `backend/repositories/users_repo.py` | Users 테이블 DB 접근 |
| `backend/services/auth_service.py` | 로그인/회원가입 비즈니스 로직 |
| `backend/services/users_service.py` | 사용자 CRUD 비즈니스 로직 |
| `backend/routers/auth.py` | `/api/auth/*` (signup, login, me, dev-login, logout) |
| `backend/routers/users.py` | `/api/users` (관리자 전용 CRUD) |

### Backend (수정 파일)
| 파일 | 변경 내용 |
|------|---------|
| `backend/sql_agent.py` | `init_db_schema()`에 Users 테이블 추가 |
| `backend/schemas.py` | 인증/사용자 관련 Pydantic 모델 추가 |
| `backend/main.py` | auth, users 라우터 등록 |
| `backend/services/agent_service.py` | `init_app_state()`에 테스트 사용자 시딩 로직 추가 |
| `backend/routers/*.py` | 모든 라우터에 `Depends(get_current_user)` 적용 |

### Frontend (신규 파일)
| 파일 | 설명 |
|------|------|
| `app/login/page.tsx` | 로그인/회원가입 페이지 UI + Dev Bypass 버튼 |
| `lib/auth-storage.ts` | 토큰 저장 유틸 (Capacitor 호환) |
| `lib/auth-context.tsx` | AuthProvider (전역 인증 상태) |
| `lib/data/auth.ts` | 인증 API 클라이언트 |
| `lib/data/users.ts` | 사용자 관리 API 클라이언트 |
| `hooks/use-users.ts` | 사용자 관리 데이터 훅 |
| `components/dashboard/users-view.tsx` | 사용자 관리 탭 컴포넌트 |

### Frontend (수정 파일)
| 파일 | 변경 내용 |
|------|---------|
| `lib/types.ts` | User, LoginRequest 등 타입 추가 |
| `lib/api.ts` | Authorization 헤더 자동 첨부, 401 처리 |
| `lib/ui-text.ts` | 로그인/사용자 관리 다국어 문자열 |
| `app/layout.tsx` | AuthProvider 래핑 |
| `app/page.tsx` | 인증 체크, 미인증 시 /login 리다이렉트 |
| `components/dashboard/sidebar.tsx` | TabType에 "users" 추가, 로그아웃 버튼 |

---

## DB 스키마 (sql_agent.py에 추가)

```sql
-- Users 테이블 (email을 로그인 키로 사용)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
CREATE TABLE Users (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    email NVARCHAR(100) UNIQUE NOT NULL,
    name NVARCHAR(100),
    password_hash NVARCHAR(255) NOT NULL,
    role NVARCHAR(20) NOT NULL DEFAULT 'user',  -- 'admin' | 'user'
    is_active BIT DEFAULT 1,
    created_at DATETIME DEFAULT GETUTCDATE(),
    updated_at DATETIME DEFAULT GETUTCDATE(),
    last_login_at DATETIME NULL
);
```

---

## API 엔드포인트

### 인증 API (공개)
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/auth/signup` | 회원가입 |
| POST | `/api/auth/login` | 로그인, JWT 발급 |
| POST | `/api/auth/dev-login` | 개발용 우회 로그인 (ALLOW_DEV_LOGIN=1 시만 활성화) |
| POST | `/api/auth/logout` | 로그아웃 (클라이언트 측 토큰 삭제) |
| GET | `/api/auth/me` | 현재 사용자 정보 (인증 필요) |

### 사용자 관리 API (관리자 전용)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/users` | 사용자 목록 |
| GET | `/api/users/{id}` | 사용자 상세 |
| POST | `/api/users` | 사용자 생성 |
| PATCH | `/api/users/{id}` | 사용자 수정 |
| DELETE | `/api/users/{id}` | 사용자 삭제 (비활성화) |

### 보호된 API (기존 라우터)
- `/api/health` - 인증 필요로 변경
- `/api/chat/*`, `/api/experiments/*`, `/api/reagents/*` 등 모든 기존 API

---

## Pydantic 모델 (schemas.py 추가)

```python
# 인증 관련
class SignupRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"

# 사용자 관련
class UserResponse(BaseModel):
    id: int
    email: str
    name: Optional[str]
    role: Literal["admin", "user"]
    is_active: bool
    created_at: datetime
    last_login_at: Optional[datetime]

class UserListResponse(BaseModel):
    items: List[UserResponse]
    total: int

class UserCreateRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = None
    role: Literal["admin", "user"] = "user"

class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    role: Optional[Literal["admin", "user"]] = None
    is_active: Optional[bool] = None
```

---

## 구현 순서

### Phase 1: Backend 인프라
1. `utils/security.py` - JWT, bcrypt 유틸
2. `utils/dependencies.py` - 인증 미들웨어
3. `sql_agent.py` - Users 테이블 스키마
4. `repositories/users_repo.py` - DB 접근
5. `services/auth_service.py`, `users_service.py`
6. `schemas.py` - Pydantic 모델
7. `routers/auth.py`, `users.py`
8. `main.py` - 라우터 등록
9. 기존 라우터에 `Depends(get_current_user)` 적용

### Phase 2: 테스트 사용자 시딩
1. `services/agent_service.py`의 `init_app_state()`에 시딩 로직 추가
2. `SEED_TEST_USERS=1`일 때 테스트 관리자 계정 생성
3. `/api/auth/dev-login` 엔드포인트 (ALLOW_DEV_LOGIN=1 시만)

### Phase 3: Frontend 인증 기반
1. `lib/types.ts` - 타입 추가
2. `lib/auth-storage.ts` - 토큰 저장
3. `lib/data/auth.ts` - API 클라이언트
4. `lib/auth-context.tsx` - AuthProvider
5. `lib/api.ts` - 토큰 자동 첨부, 401 처리
6. `app/layout.tsx` - AuthProvider 래핑

### Phase 4: 로그인/회원가입 페이지
1. `app/login/page.tsx` - 로그인 + 회원가입 폼
2. Dev Bypass 버튼 (NEXT_PUBLIC_ALLOW_DEV_BYPASS=1 시만)
3. `lib/ui-text.ts` - 다국어 문자열

### Phase 5: 대시보드 연동
1. `app/page.tsx` - 인증 체크, 미인증 시 /login 리다이렉트
2. `sidebar.tsx` - TabType에 "users" 추가, 로그아웃 버튼, isAdmin 체크

### Phase 6: 사용자 관리 탭
1. `lib/data/users.ts`
2. `hooks/use-users.ts`
3. `components/dashboard/users-view.tsx`

---

## Capacitor 호환성 설계

```typescript
// lib/auth-storage.ts - 추상화 레이어
// 현재: localStorage 사용
// 추후 Capacitor 포팅 시: @capacitor/preferences로 교체

const TOKEN_KEY = "auth_token";

export function saveToken(token: string): void {
  // 현재
  localStorage.setItem(TOKEN_KEY, token);

  // Capacitor 전환 시
  // await Preferences.set({ key: TOKEN_KEY, value: token });
}

export function getToken(): string | null {
  // 현재
  return localStorage.getItem(TOKEN_KEY);

  // Capacitor 전환 시
  // const { value } = await Preferences.get({ key: TOKEN_KEY });
  // return value;
}

export function removeToken(): void {
  // 현재
  localStorage.removeItem(TOKEN_KEY);

  // Capacitor 전환 시
  // await Preferences.remove({ key: TOKEN_KEY });
}
```

---

## 검증 방법

### 1. Backend API 테스트
```bash
# 회원가입
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test1234","name":"Test User"}'

# 로그인
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"msu@msu.lab.kr","password":"1234"}'

# 현재 사용자 정보
curl http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer <token>"

# 사용자 목록 (관리자 토큰 필요)
curl http://localhost:8000/api/users \
  -H "Authorization: Bearer <token>"

# 보호된 API 401 테스트
curl http://localhost:8000/api/health
# Expected: 401 Unauthorized
```

### 2. Frontend 테스트
- 로그인 페이지 접속: `http://localhost:3000/login`
- 회원가입 후 자동 로그인 확인
- 로그인 후 대시보드 리다이렉트 확인
- Dev Bypass 버튼 동작 확인 (env 설정 시)
- 관리자 로그인 시 "사용자 관리" 탭 표시 확인
- 일반 사용자 로그인 시 "사용자 관리" 탭 미표시 확인
- 로그아웃 후 로그인 페이지 리다이렉트 확인

### 3. 권한 테스트
- 일반 사용자로 `/api/users` 접근 시 403 확인
- 토큰 없이 보호된 API 접근 시 401 확인

---

## 추가 의존성

### Backend (requirements.txt)
```
PyJWT>=2.8.0
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
```

### Frontend (package.json)
- 추가 패키지 불필요 (기존 의존성 활용)

---

## 주요 코드 스니펫

### Backend: JWT 유틸 (utils/security.py)
```python
from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
import os

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-me-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None
```

### Backend: 인증 미들웨어 (utils/dependencies.py)
```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .security import decode_access_token
from ..repositories.users_repo import get_user_by_id

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await get_user_by_id(payload.get("sub"))
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def require_admin(user = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
```

### Backend: 테스트 사용자 시딩 (agent_service.py)
```python
import os
from ..utils.security import get_password_hash
from ..repositories.users_repo import get_user_by_email, create_user

async def seed_test_users():
    if os.getenv("SEED_TEST_USERS") != "1":
        return

    email = os.getenv("TEST_USER_EMAIL", "msu@msu.lab.kr")
    password = os.getenv("TEST_USER_PASSWORD", "1234")

    existing = await get_user_by_email(email)
    if existing:
        return

    await create_user({
        "email": email,
        "name": "Test Admin",
        "password_hash": get_password_hash(password),
        "role": "admin"
    })
    logger.info(f"Test admin user seeded: {email}")
```

### Frontend: AuthContext (lib/auth-context.tsx)
```typescript
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "./types";
import { getToken, removeToken } from "./auth-storage";
import { fetchCurrentUser } from "./data/auth";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshUser = async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const userData = await fetchCurrentUser();
      setUser(userData);
    } catch {
      removeToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    removeToken();
    setUser(null);
    router.push("/login");
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
```

### Frontend: Dev Bypass 버튼 (login/page.tsx 일부)
```typescript
const allowDevBypass = process.env.NEXT_PUBLIC_ALLOW_DEV_BYPASS === "1";

// JSX 내부
{allowDevBypass && (
  <button
    type="button"
    onClick={handleDevLogin}
    className="w-full mt-4 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
  >
    Dev Bypass Login
  </button>
)}
```

---

## 보안 고려사항

1. **비밀번호 저장**: bcrypt 해싱 사용 (plaintext 저장 금지)
2. **JWT 만료**: 8시간 후 자동 만료
3. **HTTPS**: 프로덕션에서는 반드시 HTTPS 사용
4. **XSS 방지**: localStorage 사용 시 XSS 주의
5. **CORS**: 프로덕션에서는 허용 origin 제한 필요
6. **Dev Bypass**: 프로덕션 배포 전 반드시 비활성화

---

## Cleanup 계획 (프로덕션 배포 전)

Dev Bypass 기능 제거 시:
1. `/api/auth/dev-login` 엔드포인트 삭제
2. Frontend Dev Bypass 버튼 코드 삭제
3. 환경 변수 제거:
   - `ALLOW_DEV_LOGIN`
   - `SEED_TEST_USERS`
   - `TEST_USER_EMAIL`
   - `TEST_USER_PASSWORD`
   - `NEXT_PUBLIC_ALLOW_DEV_BYPASS`
4. `init_app_state()`에서 시딩 로직 삭제
