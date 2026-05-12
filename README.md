# 🧩 SIMVEX

> 3D 기계 부품을 시각적으로 학습하고, AI 질문 응답·메모·시험 출제를 한 번에 제공하는 학습 플랫폼

## 📣 프로젝트 소개

Blaybus 해커톤에서 만든 MVP는 도메인을 빠르게 검증해주지만, **운영 단계로 넘어가려는 순간 보통 세 가지 문제**를 안고 있었어요.
타입이 느슨해서 리팩토링이 무섭고, 외부 의존성이 도메인 코드에 박혀 있어 테스트가 어렵고, 한 번에 다시 쓰자니 시간이 너무 오래 걸린다는 점이에요.

SIMVEX는 제4회 2026 블레이버스 MVP 해커톤에서 만든 3D 기계 부품 학습 플랫폼을, **레거시를 멈추지 않은 채 도메인 단위로 점진 이관**하는 방식으로 다시 쓴 프로젝트예요.

TypeScript 모노레포, 4-layer 클린 아키텍처, Repository Driver Pattern, Fastify 스키마 검증, 그리고 도메인별 통합 테스트까지 — **한 도메인 안에서 백엔드의 핵심 요소를 일관되게 설명할 수 있도록** 구성했어요.

기존 UI는 `legacy-ui/simvex-ui-main`에 그대로 보존돼 있어서, **신규 구현과 1:1로 비교**할 수 있어요.

<br />

## 🎯 프로젝트 목표

- Node.js + TypeScript 기반 백엔드 서비스 구현
- **Strangler Fig Pattern**으로 레거시를 도메인 단위로 점진 이관
- **4-layer 클린 아키텍처**로 의존 방향을 안쪽으로 강제
- **Repository Driver**로 영속성을 분리해 통합 테스트가 외부 DB 없이도 동작
- **공통 타입 패키지**로 API 계약을 단일 소스로 유지
- 도메인별 단위 / 통합 테스트로 회귀 방어

<br />

## ⚙️ 기술 스택

| 영역 | 사용 기술 |
| --- | --- |
| **Language & Runtime** | Node.js, TypeScript |
| **Backend Framework** | Fastify (스키마 검증 · 플러그인 시스템) |
| **Database** | PostgreSQL (raw `pg`, ORM 미사용) |
| **Auth** | JWT (Fastify 플러그인) |
| **Frontend** | React, Vite, Three.js |
| **Testing** | node:test (단위 · 통합) |
| **Monorepo** | npm workspaces |

<br />

## 🏗️ 아키텍처 개요

SIMVEX의 백엔드는 **모든 도메인이 같은 4-layer 구조를 따르고**, 의존은 항상 안쪽을 향해요.

```
 ┌──────────────────────────────────────────────────────┐
 │  Route (Fastify)                                 │  ← HTTP 입출력 · 스키마 검증
 │   └─→ Controller                                 │  ← 요청을 도메인 언어로 번역
 │        └─→ Service (Domain Logic)                │  ← 순수 도메인 규칙
 │             └─→ Repository (Interface)           │  ← 영속성 추상화
 │                  ├─ MemoryRepository             │
 │                  ├─ FileRepository               │
 │                  └─ PostgresRepository           │
 └──────────────────────────────────────────────────────┘
```

### Route는 HTTP 경계

Fastify 스키마로 요청·응답 형태를 강제해요. 잘못된 입력은 컨트롤러에 도달하기 전에 거절되고, 응답은 정의된 형태로만 직렬화돼요.

> 라우트 안에서만 HTTP를 다루기 때문에, 도메인 로직은 HTTP를 모르고 자기 일에만 집중할 수 있어요.

### Service는 외부 의존성을 모름

서비스는 Repository **인터페이스**에만 의존해요. DB가 PostgreSQL인지, 파일인지, 메모리인지 알 필요가 없어요.

### Repository는 드라이버로 갈아끼움

`SIMVEX_REPOSITORY_DRIVER` 환경변수로 `memory` · `file` · `postgres` 를 전환할 수 있어요.

- **로컬 개발 / 단위 테스트** → `memory`로 DB 없이 즉시 실행
- **데모 / 데이터 보존 필요** → `file`로 JSON 파일에 영속화
- **통합 테스트 / 실 환경** → `postgres`

> 덕분에 통합 테스트가 **외부 DB 없이도 그린 상태를 유지**할 수 있어요.

<br />

## 🧭 Strangler Fig 마이그레이션

레거시를 한 번에 갈아엎지 않아요. 도메인 단위로 신규 구현이 레거시를 대체하고, 그동안 두 코드는 같은 저장소에서 공존해요.

| 도메인 | 상태 | 비고 |
| --- | --- | --- |
| `memos` | ✅ Applied | 4-layer 완료 |
| `workflow / Node · Connection` | ✅ Applied | 노드/연결 도메인 분리 |
| `ai` | ✅ Applied | 사용자별 히스토리 포함 |
| `models` | ✅ Applied | 3D 모델 메타데이터 |
| `exam` | ✅ Applied | 출제 · 제출 · 채점 |
| `workflow / File (multipart)` | 🔄 In progress | 파일 업로드 흐름 이관 중 |

<br />

## 🛠️ 주요 기능

### ✅ 3D 모델 학습 뷰어

Three.js 기반 뷰어로 부품을 선택하고, 분해/조립 인터랙션을 통해 시각적으로 학습할 수 있어요. 모델 메타데이터는 백엔드 `models` 도메인에서 관리해요.

### ✅ AI 질문 / 응답

부품·조립 맥락에 기반한 질의응답을 제공해요. 사용자별 히스토리를 함께 관리해서, 이전 질문에서 이어지는 흐름을 유지할 수 있어요.

### ✅ 메모 CRUD

학습 중에 작성하는 메모를 생성·조회·수정·삭제할 수 있어요. 가장 단순한 도메인이지만, **4-layer 구조의 기준 사례**로 다른 도메인이 이 구조를 따르도록 만들었어요.

### ✅ 워크플로우 노드 / 연결

학습 흐름을 노드와 연결로 모델링해요. 노드와 연결은 별도 도메인으로 분리해서, 각자의 라이프사이클을 가져요.

### ✅ 시험 출제 / 제출 / 채점

문제 출제, 사용자 제출, 채점까지 한 도메인 안에서 처리해요. 채점 규칙은 Service 계층에 모여 있어서, 외부 의존성 없이 단위 테스트로 검증할 수 있어요.

### ✅ JWT 기반 사용자 인증

Fastify 플러그인으로 인증을 분리해서, 라우트는 `request.user`가 있다는 가정만 가지고 자기 일에 집중해요.

<br />

## 🔒 백엔드 설계 원칙

SIMVEX에서 양보하지 않은 규칙들이에요.

- 도메인 코드는 **HTTP·DB·파일 시스템을 모름** — 외부 의존은 인터페이스로만 표현
- 모든 라우트는 **Fastify 스키마로 입출력 형태를 강제**
- 영속성은 **드라이버 단위로 교체 가능** — `memory` · `file` · `postgres`
- 통합 테스트는 **실제 DB 없이도 그린** — `memory` 드라이버 활용
- 프론트/백 사이 계약은 **공통 타입 패키지(`@simvex/shared`)** 가 단일 진실 소스
- 마이그레이션은 **도메인 단위로 점진** — Strangler Fig

<br />

## 📂 디렉터리 구조

```
.
├── apps/
│   ├── api/                      Fastify 백엔드 (4-layer per domain)
│   │   └── src/
│   │       ├── plugins/          auth(JWT), schema, error handler
│   │       ├── domains/          memos · workflow · ai · models · exam
│   │       │   └── <domain>/
│   │       │       ├── route.ts
│   │       │       ├── controller.ts
│   │       │       ├── service.ts
│   │       │       └── repository/
│   │       │           ├── memory.ts
│   │       │           ├── file.ts
│   │       │           └── postgres.ts
│   │       └── infra/            db connection, migrations
│   └── web/                      React + Vite 프론트엔드
├── packages/
│   └── shared/                   공통 API 타입/계약 (@simvex/shared)
├── legacy-ui/
│   └── simvex-ui-main/           비교용 기존 UI
└── docs/
```

<br />

## 🚀 빠른 시작

### 1. 의존성 설치

```bash
npm install
```

### 2. 로컬 DB 실행 (PostgreSQL 모드를 쓸 경우)

```bash
npm run db:up
npm run db:migrate:local
```

### 3. API 서버 실행

```bash
# PostgreSQL 모드
npm run dev:api:pg

# 메모리 모드 (DB 없이 바로 실행)
npm run dev -w @simvex/api
```

### 4. 웹 앱 실행

```bash
npm run dev -w @simvex/web
```

### 저장소 드라이버 전환

```bash
# PostgreSQL (PowerShell 기준)
$env:SIMVEX_REPOSITORY_DRIVER='postgres'
$env:DATABASE_URL='postgres://dosacha:dosacha@localhost:5432/simvex'

# File
$env:SIMVEX_REPOSITORY_DRIVER='file'
$env:SIMVEX_REPOSITORY_FILE='C:\\data\\simvex-repo.json'
```

<br />

## 🧪 테스트

| 목적 | 명령 |
| --- | --- |
| API 단위 · 계약 테스트 | `npm run test:unit -w @simvex/api` |
| API PostgreSQL 통합 테스트 | `npm run test:postgres -w @simvex/api` |
| 마이그레이션 검증 | `npm run migrate:validate -w @simvex/api` |
| DB 스모크 체크 | `npm run db:smoke -w @simvex/api` |
| API 타입 체크 | `npm run typecheck -w @simvex/api` |
| Web 타입 체크 | `npm run typecheck -w @simvex/web` |

> 단위 테스트는 모두 `memory` 드라이버 위에서 동작해요. 외부 DB가 없어도 그린이에요.

<br />

## 🎬 Legacy UI 비교 실행

기존 UI는 신규 구현과의 차이를 검증하기 위해 그대로 보존돼 있어요.

```bash
cd legacy-ui/simvex-ui-main
npm install
npm start
```

| 항목 | 주소 |
| --- | --- |
| Legacy UI | `http://localhost:3000` |
| API 프록시 대상 | `http://localhost:8080` |

<br />

## 🗺️ 코드 읽는 순서 (추천)

처음 본다면 이 순서로 따라가면 SIMVEX의 백엔드 흐름을 가장 빠르게 잡을 수 있어요.

1. `apps/api/src/main.ts` — 진입점
2. `apps/api/src/plugins/auth.ts` — JWT 인증 플러그인
3. `apps/api/src/domains/memos/route.ts` — 가장 단순한 도메인의 라우트와 스키마
4. `apps/api/src/domains/memos/controller.ts` — 컨트롤러 계층
5. `apps/api/src/domains/memos/service.ts` — 순수 도메인 로직
6. `apps/api/src/domains/memos/repository/memory.ts` — 메모리 드라이버
7. `apps/api/src/domains/memos/repository/postgres.ts` — PostgreSQL 드라이버 (같은 인터페이스를 어떻게 다르게 구현했는지)
8. `apps/api/src/domains/exam/service.ts` — 도메인 규칙이 더 복잡한 사례
9. `apps/api/src/domains/workflow/` — 노드/연결/파일 도메인 분리 사례
10. `packages/shared/` — 프론트와 백이 공유하는 타입 계약
