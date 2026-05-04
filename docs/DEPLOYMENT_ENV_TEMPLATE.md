# 배포 환경 변수 템플릿

기준일: 2026-02-17

## 공통 원칙
- `SIMVEX_REPOSITORY_DRIVER=postgres`를 기본으로 사용함.
- `DATABASE_URL`을 1순위로 사용하고, 필요 시 `POSTGRES_URL`을 동일 값으로 유지함.
- `SIMVEX_CORS_ORIGINS`는 쉼표 구분 문자열로 관리함.
- `SIMVEX_JWT_SECRET`는 최소 32자 (HS256 브루트포스 방어 기준). 환경마다 서로 다른 값.
  - 생성 예: `openssl rand -base64 48`
  - 환경 간 공유하지 말 것 — stage 토큰이 prod 에 통하면 격리가 무너짐.
- 비밀값(DB 계정/비밀번호/JWT secret/API 키)은 Git에 커밋하지 않고 배포 플랫폼 Secret으로만 주입함.

## dev
- `NODE_ENV=development`
- `SIMVEX_REPOSITORY_DRIVER=postgres`
- `DATABASE_URL=postgres://dosacha:dosacha@localhost:5432/simvex`
- `SIMVEX_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173`
- `SIMVEX_JWT_SECRET=<dev 전용 최소 32자 secret>` (운영과 절대 공유 금지)
- `PORT=8080`
- `HOST=0.0.0.0`

## stage
- `NODE_ENV=staging`
- `SIMVEX_REPOSITORY_DRIVER=postgres`
- `DATABASE_URL=postgres://<stage_user>:<stage_password>@<stage_db_host>:5432/<stage_db_name>`
- `SIMVEX_CORS_ORIGINS=https://stage.simvex.com`
- `SIMVEX_JWT_SECRET=<stage 전용 최소 32자 secret>` (배포 플랫폼 Secret 으로만 주입)
- `PORT=8080`
- `HOST=0.0.0.0`

## prod
- `NODE_ENV=production`
- `SIMVEX_REPOSITORY_DRIVER=postgres`
- `DATABASE_URL=postgres://<prod_user>:<prod_password>@<prod_db_host>:5432/<prod_db_name>`
- `SIMVEX_CORS_ORIGINS=https://simvex.com,https://www.simvex.com`
- `SIMVEX_JWT_SECRET=<prod 전용 최소 32자 secret>` (배포 플랫폼 Secret 으로만 주입, stage 와 동일하지 않게)
- `PORT=8080`
- `HOST=0.0.0.0`

## 배포 직전 점검
1. stage/prod `SIMVEX_CORS_ORIGINS`에 실제 도메인만 포함됐는지 확인.
2. `DATABASE_URL`이 읽기/쓰기 가능한 계정인지 확인.
3. `SIMVEX_JWT_SECRET` 가 환경별로 서로 다른 32자 이상 값인지, stage / dev / prod 간 우발적 공유 없는지 확인.
4. 스테이징에서 `npm run db:smoke -w @simvex/api` 통과 확인.
5. 스테이징에서 `npm run rehearsal:check -w @simvex/api` 가 SIMVEX_JWT_SECRET 길이 검증을 포함해 통과하는지 확인.
6. 스테이징에서 핵심 API 계약 테스트 통과 확인.
