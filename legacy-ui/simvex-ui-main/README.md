# SIMVEX TypeScript Rewrite

> 3D 기계 부품 학습 플랫폼의 Java 해커톤 MVP 를 TypeScript 4-layer monorepo 로
> 점진 재작성한 프로젝트입니다. legacy React UI 는 백엔드 API 호환성을 확인하는
> 기준 클라이언트로 유지합니다.

## Highlights

- 4-layer 클린 아키텍처 (controller -> service -> repository -> entity)
- JWT 인증 (HS256, `@fastify/jwt`) + repository-level 인가 격리 (`user_id` 자동 조건)
- 통합 테스트 그린 - `test:unit` 14/14 (계약 10, 도메인 4) + `test:postgres` 2/2
- memory / file / postgres repository driver 분리
- legacy v1 API 에서 v2 API 로 endpoint 와 인증 방식을 정리

## 아키텍처 한눈에

```text
legacy-ui (React, JavaScript)
  |
  v
Fastify API (TypeScript)
  |
  v
Service / Repository / Entity
  |
  v
PostgreSQL or memory/file driver
```

서버 코드는 `buildServer()` 한 군데에서 만들어져 테스트와 로컬 실행 경로가 같은
Fastify 앱을 사용합니다.

## 기술 스택

- **Legacy UI**: React + JavaScript + Three.js
- **API**: Node.js 20 + TypeScript + Fastify + `@fastify/jwt`
- **Shared**: 공통 API 타입 계약 (`packages/shared`)
- **DB**: PostgreSQL (memory / file / postgres repository driver 지원)

## 프로젝트 구조

```text
apps/
  api/              # Fastify API (4-layer 클린 아키텍처)
packages/
  shared/           # API 공통 타입 계약
legacy-ui/
  simvex-ui-main/   # legacy frontend source
docs/               # 백엔드 설계/보안/API 문서
scripts/            # 개발 보조 스크립트
```

## 리팩토링 단계 정의

문서 곳곳에서 등장하는 "1단계 / 5단계 / 6단계" 같은 표현은 다음을 의미합니다.

| 단계 | 내용 | 상태 |
| --- | --- | --- |
| 1단계 | 4-layer 클린 아키텍처 분리 (controller -> service -> repository -> entity) | 완료 |
| 2단계 | auth plugin 격리 + JSON schema 입력 검증 | 완료 |
| 3단계 | 도메인 단위 v1 -> v2 마이그레이션 (ai · models · memos · exam · workflow) | 완료 |
| 4단계 | repository driver 추상화 (memory/file/postgres) + Postgres 마이그레이션 체계 + `ON DELETE CASCADE` 로 트랜잭션 단순화 | 완료 |
| 5단계 | narrative cleanup - legacy v1 routes 제거, dead code 제거, AI 오류 502 -> 500 (RFC 의미 정확화) | 완료 |
| 6단계 | multipart register 위치를 auth plugin scope 안으로 이동 (DoS 방어) + 도메인 폴더 구조 정리 + JWT 인증 도입 (`X-User-ID` 헤더 -> `Authorization: Bearer <token>`) | 완료 |

자세한 진행 현황은 [`docs/PROJECT_STATUS.md`](../../docs/PROJECT_STATUS.md).

## 빠른 시작

### Prerequisites
- Node.js 20+
- Docker (로컬 PostgreSQL 컨테이너용)

### 실행
```bash
# 1. 루트 의존성 설치
npm install

# 2. 로컬 PostgreSQL 실행 + 마이그레이션
npm run db:up
npm run db:migrate:local

# 3. API 실행 (Postgres 모드)
npm run dev:api:pg

# 4. Legacy UI 실행
cd legacy-ui/simvex-ui-main
npm install
npm start
```

- Legacy UI 기본 주소: `http://localhost:3000`
- API 프록시 기본 주소: `http://localhost:8080`

### 인증 토큰 (개발 시)
```bash
npm run mint-token -w @simvex/api -- <userId> [expiresIn]
```

정식 login / 회원가입 흐름은 backlog 입니다. 현재 개발 환경에서는 `mint-token` 으로 토큰을 발급합니다.

## 검증 명령

```bash
npm run typecheck        -w @simvex/api  # 타입체크
npm run test:unit        -w @simvex/api  # 단위/계약 테스트 14
npm run test:postgres    -w @simvex/api  # postgres 통합 테스트 2
npm run migrate:validate -w @simvex/api  # 마이그레이션 정합성 검증
npm run db:smoke         -w @simvex/api  # DB 스모크체크
```

## 문서

- [`docs/SECURITY_MODEL.md`](../../docs/SECURITY_MODEL.md) - 인증/인가/CORS/multipart/AI 마스킹 전반
- [`docs/API_COMPATIBILITY.md`](../../docs/API_COMPATIBILITY.md) - v1 <-> v2 endpoint 호환 맵
- [`docs/PROJECT_STATUS.md`](../../docs/PROJECT_STATUS.md) - 단계별 진행 현황
- [`docs/PLAN.md`](../../docs/PLAN.md) - 리라이트 계획
