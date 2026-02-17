# Operations Runbook

## 목적
- 운영 환경에서 API/PostgreSQL 상태를 점검하고 장애 대응 절차를 빠르게 실행하기 위한 기준 문서.

## 기본 점검 순서
1. API 프로세스 상태 확인.
2. DB 연결/마이그레이션 상태 확인.
3. 주요 API 헬스체크 및 핵심 엔드포인트 확인.

## 로컬/운영 공통 명령
- DB 마이그레이션 검증: `npm run migrate:validate -w @simvex/api`
- DB 마이그레이션 실행: `npm run migrate -w @simvex/api`
- DB 스모크체크: `npm run db:smoke -w @simvex/api`

## 로컬 postgres 개발 명령
- 컨테이너 실행: `npm run db:up`
- 마이그레이션 실행: `npm run db:migrate:local`
- DB 스모크체크: `npm run db:smoke:local`
- API 실행(postgres 모드): `npm run dev:api:pg`
- 로그 확인: `npm run db:logs`
- 컨테이너 종료: `npm run db:down`

## 배포 전 체크리스트
1. `npm ci`
2. `npm run migrate:validate -w @simvex/api`
3. `npm run typecheck -w @simvex/api`
4. `npm run test:unit -w @simvex/api`
5. `npm run test:postgres -w @simvex/api`
6. `npm run typecheck -w @simvex/web`
7. `docs/DEPLOYMENT_ENV_TEMPLATE.md` 기준으로 stage/prod 환경변수 최종 확인

## 장애 대응 가이드
### 1) API 5xx 증가
1. 애플리케이션 로그에서 스택트레이스 확인.
2. DB 스모크체크 실행해 연결 상태 확인.
3. 최근 마이그레이션 적용 여부(`schema_migrations`) 확인.

### 2) DB 연결 장애
1. `DATABASE_URL`/`POSTGRES_URL` 환경변수 오타 여부 확인.
2. DB 포트 접근 가능 여부 확인.
3. `npm run db:smoke -w @simvex/api` 재실행.

### 3) 마이그레이션 실패
1. 실패한 버전 SQL 파일 확인.
2. `schema_migrations`에 해당 버전이 기록됐는지 확인.
3. SQL 수정 후 재배포 전에 `migrate:validate`와 `migrate`를 다시 실행.

## 백업/복구 권장
- 백업: `pg_dump` 기반으로 정기 백업 스케줄 구성.
- 복구: 스냅샷 복구 후 `schema_migrations`와 실제 테이블 상태를 함께 확인.
- 복구 검증: `db:smoke`와 핵심 API 계약 테스트를 재실행.
