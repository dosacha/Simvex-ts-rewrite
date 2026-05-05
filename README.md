# SIMVEX TypeScript Rewrite

기존 SIMVEX MVP를 Fastify API와 TypeScript monorepo 기준으로 정리한 저장소입니다.

## 기술 스택
- Legacy UI: React + JavaScript + Three.js
- API: Node.js + TypeScript + Fastify
- Shared: 공통 API 타입 계약
- DB: PostgreSQL, memory/file repository driver 지원

## 프로젝트 구조
```text
apps/
  api/      # Fastify API
packages/
  shared/   # API 공통 타입 계약
legacy-ui/
  simvex-ui-main/  # legacy frontend source
```

## 빠른 시작
1. 루트 의존성 설치
```bash
npm install
```

2. 로컬 PostgreSQL 실행 및 마이그레이션
```bash
npm run db:up
npm run db:migrate:local
```

3. API 실행 (Postgres 모드)
```bash
npm run dev:api:pg
```

4. Legacy UI 실행
```bash
cd legacy-ui/simvex-ui-main
npm install
npm start
```

- Legacy UI 기본 주소: `http://localhost:3000`
- API 프록시 기본 주소: `http://localhost:8080`

## 검증 명령
- 마이그레이션 검증: `npm run migrate:validate -w @simvex/api`
- DB 스모크체크: `npm run db:smoke -w @simvex/api`
- API unit/contract 테스트: `npm run test:unit -w @simvex/api`
- API postgres 테스트: `npm run test:postgres -w @simvex/api`
- API 타입체크: `npm run typecheck -w @simvex/api`

## 문서
- 보안 모델: `docs/SECURITY_MODEL.md`
- API 호환 맵: `docs/API_COMPATIBILITY.md`
- 진행 현황: `docs/PROJECT_STATUS.md`
