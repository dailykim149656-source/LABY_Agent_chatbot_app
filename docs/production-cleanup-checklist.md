# Production 전환 시 제거/비활성화 체크리스트

> 목적: 테스트/개발 편의 기능이 운영에 남아 보안 사고로 이어지지 않도록 정리

## 1. API/기능 제거 또는 비활성화
- [ ] `/api/auth/dev-login` 라우트 제거 또는 완전 비활성
  - `ALLOW_DEV_LOGIN=0`
  - `DEV_LOGIN_SECRET` 삭제
- [ ] 테스트 로그인 버튼 숨김/삭제
  - `NEXT_PUBLIC_ALLOW_DEV_BYPASS=0`
  - `NEXT_PUBLIC_TEST_LOGIN_EMAIL/PASSWORD` 삭제
  - 로그인 화면의 테스트 버튼 제거
  - GitHub Actions(SWA 빌드) env에서 해당 값 제거
- [ ] 테스트 사용자 자동 시딩 비활성화
  - `SEED_TEST_USERS=0`
  - `TEST_USER_EMAIL/TEST_USER_PASSWORD` 삭제

## 2. 환경 변수/시크릿 정리
- [ ] 개발용 시크릿 제거
  - `DEV_LOGIN_SECRET`
  - `NEXT_PUBLIC_DEV_LOGIN_SECRET`
- [ ] GitHub Actions(SWA) 빌드 환경변수에서 테스트 값 제거
  - `NEXT_PUBLIC_ALLOW_DEV_BYPASS`
  - `NEXT_PUBLIC_TEST_LOGIN_EMAIL`
  - `NEXT_PUBLIC_TEST_LOGIN_PASSWORD`
- [ ] `APP_ENV=production` 확인
- [ ] `CORS_ALLOW_ORIGINS`를 실제 프론트 도메인으로만 제한
- [ ] `COOKIE_SAMESITE=none` + HTTPS 강제
- [ ] `ENABLE_HSTS=1` (운영 권장)

## 3. UI/문구 정리
- [ ] 테스트용 UI 문구/버튼 제거
  - “테스트 계정으로 로그인” 등
- [ ] 테스트 데이터 노출 화면 제거(있다면)

## 4. 운영 보안 점검
- [ ] `JWT_SECRET_KEY`는 충분히 긴 랜덤 키로 재설정
- [ ] 비밀번호 정책 유지(최소 8자 + 영문/숫자)
- [ ] 로그인 rate limit 유지
- [ ] CSRF 보호 활성 유지(`CSRF_DISABLED` 미설정)

---

## 참고
- 테스트 로그인 버튼과 dev-login은 **운영에서 반드시 제거/비활성** 권장
- 설정 변경 후 재배포 필요
