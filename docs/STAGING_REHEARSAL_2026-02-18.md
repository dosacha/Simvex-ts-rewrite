# Staging Rehearsal Result

실행 일시: 2026-02-18 11:10 +09:00  
실행자: dosacha + Codex  
대상 환경: stage 리허설(로컬 postgres 기준)  
API 버전(커밋 SHA): `2b8beea`

## 실행 명령
```bash
npm run rehearsal:stage
```

## 단계별 결과
- [x] `migrate:validate` 통과
- [x] `db:smoke` 통과
- [x] `test:unit` 통과

## 실행 로그 핵심 요약
- `rehearsal:check` 통과
  - `SIMVEX_REPOSITORY_DRIVER=postgres`
  - `DATABASE_URL=postgres://dosacha:***@localhost:5432/simvex`
  - `SIMVEX_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173`
- `migrate:validate` 통과
  - `001_init.sql`, `002_indexes.sql`, `003_constraints.sql`
- `db:smoke` 통과
  - `applied_migrations: 3`
  - `latest_migration: 003_constraints.sql`
- `test:unit` 통과
  - `pass 9 / fail 0`

## 재실행 기록 (같은 날 2차)
- 실행 일시: 2026-02-18 11:26 +09:00
- 실행 명령: `.\scripts\run-stage-rehearsal.ps1 -EnvFile env/stage.env`
- 결과:
  - `rehearsal:check` 통과
  - `migrate:validate` 통과
  - `db:smoke` 통과 (`latest_migration: 003_constraints.sql`)
  - `test:unit` 통과 (`pass 9 / fail 0`)

## 재실행 기록 (같은 날 3차)
- 실행 일시: 2026-02-18 11:31 +09:00
- 실행 명령: `.\scripts\run-stage-rehearsal.ps1 -EnvFile env/stage.env`
- 결과:
  - `rehearsal:check` 통과
  - `migrate:validate` 통과
  - `db:smoke` 통과 (`latest_migration: 003_constraints.sql`)
  - `test:unit` 통과 (`pass 9 / fail 0`)

## 후속 조치
1. 실제 stage 인프라 DB(`stage.simvex.com` 도메인/실 DB 호스트)로 동일 리허설 1회 재실행.
2. 실행 결과를 본 문서에 추가 기록 후 배포 판정 확정.

## 최종 판정
- [x] 배포 진행 가능(리허설 기준 충족)
- [ ] 보류
