# Deployment Env Template

기준일: 2026-02-17

## 공통 원칙
- `SIMVEX_REPOSITORY_DRIVER=postgres`를 기본으로 사용함.
- `DATABASE_URL`을 1순위로 사용하고, 필요 시 `POSTGRES_URL`을 동일 값으로 유지함.
- `SIMVEX_CORS_ORIGINS`는 쉼표 구분 문자열로 관리함.
- 비밀값(DB 계정/비밀번호/API 키)은 Git에 커밋하지 않고 배포 플랫폼 Secret으로만 주입함.

## dev
- `NODE_ENV=development`
- `SIMVEX_REPOSITORY_DRIVER=postgres`
- `DATABASE_URL=postgres://dosacha:dosacha@localhost:5432/simvex`
- `SIMVEX_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173`
- `PORT=8080`
- `HOST=0.0.0.0`

## stage
- `NODE_ENV=staging`
- `SIMVEX_REPOSITORY_DRIVER=postgres`
- `DATABASE_URL=postgres://<stage_user>:<stage_password>@<stage_db_host>:5432/<stage_db_name>`
- `SIMVEX_CORS_ORIGINS=https://stage.simvex.com`
- `PORT=8080`
- `HOST=0.0.0.0`

## prod
- `NODE_ENV=production`
- `SIMVEX_REPOSITORY_DRIVER=postgres`
- `DATABASE_URL=postgres://<prod_user>:<prod_password>@<prod_db_host>:5432/<prod_db_name>`
- `SIMVEX_CORS_ORIGINS=https://simvex.com,https://www.simvex.com`
- `PORT=8080`
- `HOST=0.0.0.0`

## 배포 직전 점검
1. stage/prod `SIMVEX_CORS_ORIGINS`에 실제 도메인만 포함됐는지 확인.
2. `DATABASE_URL`이 읽기/쓰기 가능한 계정인지 확인.
3. 스테이징에서 `npm run db:smoke -w @simvex/api` 통과 확인.
4. 스테이징에서 핵심 API 계약 테스트 통과 확인.
