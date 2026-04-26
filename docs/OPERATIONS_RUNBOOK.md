# 운영 런북

## 목적
운영 환경에서 API/PostgreSQL 상태를 점검하고 장애 대응 절차를 빠르게 실행하기 위한 기준 문서입니다.

## 기본 점검 순서
1. API 프로세스 상태를 확인합니다.
2. DB 연결과 마이그레이션 상태를 확인합니다.
3. 주요 API 스모크체크와 핵심 워크플로우를 확인합니다.

## 로컬/운영 공통 명령
- DB 마이그레이션 검증: `npm run migrate:validate -w @simvex/api`
- DB 마이그레이션 실행: `npm run migrate -w @simvex/api`
- DB 스모크체크: `npm run db:smoke -w @simvex/api`

## 로컬 Postgres 개발 명령
- 컨테이너 실행: `npm run db:up`
- 마이그레이션 실행: `npm run db:migrate:local`
- DB 스모크체크: `npm run db:smoke:local`
- API 실행(Postgres 모드): `npm run dev:api:pg`
- 로그 확인: `npm run db:logs`
- 컨테이너 종료: `npm run db:down`

## 배포 전 체크리스트
1. `npm ci`
2. `npm run migrate:validate -w @simvex/api`
3. `npm run typecheck -w @simvex/api`
4. `npm run test:unit -w @simvex/api`
5. `npm run test:postgres -w @simvex/api`
6. `legacy-ui/simvex-ui-main`에서 legacy UI 빌드 확인
7. `docs/DEPLOYMENT_ENV_TEMPLATE.md` 기준으로 stage/prod 환경 변수를 최종 확인

## 스테이징 리허설
- 통합 실행 명령: `npm run rehearsal:stage`
- 실행/기록 템플릿: `docs/STAGING_REHEARSAL_TEMPLATE.md`

## 장애 대응 가이드
### API 5xx 증가
1. 애플리케이션 로그에서 stack trace를 확인합니다.
2. DB 스모크체크를 실행해 연결 상태를 확인합니다.
3. 최근 마이그레이션 적용 여부(`schema_migrations`)를 확인합니다.

### DB 연결 장애
1. `DATABASE_URL`/`POSTGRES_URL` 환경 변수 오타 여부를 확인합니다.
2. DB 포트 접근 가능 여부를 확인합니다.
3. `npm run db:smoke -w @simvex/api`를 재실행합니다.

### 마이그레이션 실패
1. 실패한 버전의 SQL 파일을 확인합니다.
2. `schema_migrations`에 해당 버전이 기록됐는지 확인합니다.
3. SQL 수정 후 배포 전에 `migrate:validate`와 `migrate`를 다시 실행합니다.
