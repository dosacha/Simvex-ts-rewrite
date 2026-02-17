# SIMVEX TypeScript Rewrite

목표: 기존 핵심 기능을 유지하면서 타입 안정성, 모듈성, 테스트 가능성을 높인 구조로 재작성.

## 범위
- Web: React + TypeScript + Three.js
- API: Node.js + TypeScript (Fastify)
- Shared: API 계약 타입/스키마 공유

## 핵심 기능 (유지)
- 3D 모델 학습 뷰어 (파트 선택, 분해/조립 슬라이더)
- AI 질문/응답 + 사용자별 히스토리
- 메모 CRUD
- 워크플로우 노드/연결/첨부파일
- 모의고사(문제 풀이/결과)

## 현재 상태
- 프로젝트 골격 생성 완료
- API repository 계층 분리 완료 (in-memory 기본 동작)
- 선택적으로 파일 영속화 지원 추가

## API 저장소 모드
- 지원 드라이버:
  - `memory` (기본)
  - `file`
  - `postgres`
- 드라이버 선택:
  - 환경변수 `SIMVEX_REPOSITORY_DRIVER`를 사용함.
  - 예시: `$env:SIMVEX_REPOSITORY_DRIVER='postgres'`
- 파일 영속화(`file`) 사용 시:
  - 환경변수 `SIMVEX_REPOSITORY_FILE`에 JSON 파일 경로를 설정함.
  - 예시(Windows PowerShell): `$env:SIMVEX_REPOSITORY_FILE='C:\\data\\simvex-repo.json'`
- PostgreSQL(`postgres`) 사용 시:
  - 환경변수 `DATABASE_URL` 또는 `POSTGRES_URL`을 설정함.
  - 예시: `$env:DATABASE_URL='postgres://user:pass@localhost:5432/simvex'`
  - 초기 스키마 기준 파일: `apps/api/db/migrations/001_init.sql`
  - 마이그레이션 실행: `npm run migrate -w @simvex/api`

## 로컬 Postgres 개발 흐름
- 컨테이너 실행: `npm run db:up`
- 로컬 DB 마이그레이션: `npm run db:migrate:local`
- Postgres 모드 API 실행: `npm run dev:api:pg`
- DB 로그 확인: `npm run db:logs`
- 컨테이너 종료: `npm run db:down`
