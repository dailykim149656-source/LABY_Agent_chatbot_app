# Auth Implementation Steps (LABY Agent Chatbot App)

Date: 2026-02-04

Scope
- Add public signup + login.
- Protect all APIs (including /api/health) with JWT access tokens.
- Admin/user separation with a Users management UI tab.
- Dev bypass login button gated by env flags.
- Storage abstraction for Capacitor portability.

Decisions
- Access token only (no refresh token).
- Token TTL: 8 hours.
- Login key: email.
- Test admin user: msu@msu.lab.kr / 1234.
- All APIs require auth except /api/auth/* (and /api/auth/dev-login when enabled).

Environment Flags
- Backend (azure_and_sql.env)
- JWT_SECRET_KEY
- ACCESS_TOKEN_EXPIRE_MINUTES=480
- ALLOW_DEV_LOGIN=1
- SEED_TEST_USERS=1
- TEST_USER_EMAIL=msu@msu.lab.kr
- TEST_USER_PASSWORD=1234
- Frontend (.env.local)
- NEXT_PUBLIC_API_BASE_URL
- NEXT_PUBLIC_ALLOW_DEV_BYPASS=1

Behavior Notes
- No refresh tokens. On 401, clear token and redirect to /login.
- The login page must not call protected endpoints.
- /api/auth/logout is optional; if included, it should be a no-op returning 200.

Phase 1. Backend auth foundation
- Add backend/utils/security.py (bcrypt + JWT).
- Add backend/utils/dependencies.py (get_current_user, require_admin).
- Add Users table to backend/sql_agent.py init_db_schema() (additive only).
- Add backend/repositories/users_repo.py.
- Add backend/services/auth_service.py.
- Add backend/services/users_service.py.
- Add DTOs to backend/schemas.py (SignupRequest, LoginRequest, LoginResponse, UserResponse, UserListResponse, UserCreateRequest, UserUpdateRequest).
- Add backend/routers/auth.py: signup, login, me, dev-login, logout.
- Add backend/routers/users.py: admin-only CRUD.
- Register auth/users routers in backend/main.py.
- Enforce Depends(get_current_user) on all routers except /api/auth/*.
- Protect /api/health too.

Phase 2. Test user seeding + dev login
- In backend/services/agent_service.py init_app_state(): if SEED_TEST_USERS=1, seed admin user with email/password.
- Seeding must be idempotent (upsert by email) and hash the password.
- Enable /api/auth/dev-login only if ALLOW_DEV_LOGIN=1.
- Dev login returns a real access token (same flow as login).
- Dev login is dev-only; ensure it is disabled in production.

Phase 3. Frontend auth foundation
- Add chemical-sample-dashboard/lib/auth-storage.ts (token store abstraction).
- Add chemical-sample-dashboard/lib/auth-context.tsx (AuthProvider).
- Add chemical-sample-dashboard/lib/data/auth.ts (auth API client).
- Update chemical-sample-dashboard/lib/api.ts (attach Authorization header, handle 401).
- Wire AuthProvider in chemical-sample-dashboard/app/layout.tsx.

Phase 4. Login and signup UI
- Add chemical-sample-dashboard/app/login/page.tsx with login + signup forms.
- Add "Dev Bypass" button gated by NEXT_PUBLIC_ALLOW_DEV_BYPASS=1.
- After login, persist token and redirect to /.

Phase 5. App guard + admin tab
- Update chemical-sample-dashboard/app/page.tsx to redirect unauthenticated users to /login.
- Add "users" tab in chemical-sample-dashboard/components/dashboard/sidebar.tsx (admin only).
- Optional: add a logout button in the sidebar or header using useAuth().

Phase 6. User management UI
- Add chemical-sample-dashboard/components/dashboard/users-view.tsx.
- Add lib/data/users.ts and hooks/use-users.ts.
- Update chemical-sample-dashboard/lib/types.ts and chemical-sample-dashboard/lib/ui-text.ts for new types/labels.

Verification
- API tests: signup, login, me, users list with admin token, 401 on protected endpoints.
- FE tests: login flow, dev bypass flow, admin tab visibility, logout redirect.

Cleanup plan (when dev bypass is removed)
- Remove /api/auth/dev-login and frontend dev bypass button.
- Delete SEED_TEST_USERS and ALLOW_DEV_LOGIN flags from env.
- Remove seed logic from init_app_state().
