# Architecture

SIMVEX 백엔드는 **모든 도메인이 같은 구조를 따르고, 의존은 항상 안쪽을 향한다**는 단 하나의 규칙을 따릅니다.
이 문서는 그 규칙이 왜 필요했고, 어떻게 강제되며, 어떤 대가를 치렀는지를 정리한 기록입니다.

<br />

## 구조

해커톤 MVP는 보통 세 가지 문제를 안고 있습니다.

- 도메인 로직 안에 HTTP 객체나 DB 클라이언트가 직접 박혀 있어 **테스트가 어려움**
- 외부 의존성이 바뀌면 도메인 코드까지 같이 바뀌어 **변경이 위험함**
- 한 번에 다시 쓰자니 **그동안 서비스를 멈출 수 없음**

SIMVEX는 이 세 가지를 동시에 해결하기 위해 다음 세 패턴을 도입했습니다.

| 문제 | 해결 패턴 |
| --- | --- |
| 도메인이 외부에 결합돼 테스트가 어려움 | **4-Layer Clean Architecture** — 의존을 안쪽으로만 |
| 영속성이 바뀌면 도메인이 깨짐 | **Repository Driver Pattern** — 영속성을 인터페이스 뒤로 |
| 한 번에 갈아엎을 수 없음 | **Strangler Fig Pattern** — 도메인 단위 점진 이관 |

세 패턴은 독립적이지 않고 서로를 지탱합니다. Clean Architecture가 있어야 Repository Driver가 성립하고, Repository Driver가 있어야 Strangler Fig 이관이 안전하게 진행됩니다.

<br />

## 4-Layer Clean Architecture

### 의존 방향

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

화살표는 절대 거꾸로 가지 않습니다. Service가 Route를 import하는 순간 이 구조는 무너집니다.

### 각 레이어의 책임

**Route — HTTP 경계**
Fastify 스키마로 요청·응답 형태를 강제합니다. 잘못된 입력은 컨트롤러에 도달하기 전에 거절되고, 응답은 정의된 형태로만 직렬화됩니다. 라우트 안에서만 HTTP를 다루므로, 안쪽 레이어는 HTTP를 모르고 자기 일에만 집중할 수 있습니다.

**Controller — 번역가**
HTTP 요청을 도메인 언어로 번역하고 Service를 호출합니다. 결과를 다시 HTTP 응답 형태로 매핑해 라우트에 반환합니다. Controller는 분기는 가질 수 있지만 *비즈니스 분기*는 가지지 않습니다. 비즈니스 분기는 Service의 책임입니다.

**Service — 순수 도메인 규칙**
서비스는 외부 의존성을 모르고, Repository 인터페이스에만 의존합니다. DB가 PostgreSQL인지, 파일인지, 메모리인지 알 필요가 없습니다. 이 덕분에 Service는 HTTP 없이, DB 없이도 단위 테스트가 가능합니다. 실제로 SIMVEX의 단위 테스트는 모두 Service 계층을 대상으로 합니다.

**Repository — 영속성 추상화**
Repository는 인터페이스로 정의되고, 드라이버 구현이 주입됩니다. Service는 이 인터페이스만 보고, 어떤 드라이버가 들어오는지 모르고도 동작합니다.

<br />

## Repository Driver Pattern

### 세 가지 드라이버의 역할

| 드라이버 | 용도 | 시간 비용 |
| --- | --- | --- |
| `memory` | 단위 테스트 · 로컬 개발 · CI | 즉시 |
| `file` | 데모 · 데이터 보존 필요한 로컬 시연 | 거의 즉시 |
| `postgres` | 통합 테스트 · 실 환경 | DB 기동 필요 |

`SIMVEX_REPOSITORY_DRIVER` 환경변수로 전환합니다.

```bash
# PowerShell 기준
$env:SIMVEX_REPOSITORY_DRIVER='memory'
$env:SIMVEX_REPOSITORY_DRIVER='file'
$env:SIMVEX_REPOSITORY_DRIVER='postgres'
```

### 가장 큰 효과: 외부 DB 없는 통합 테스트

memory 드라이버는 단위 테스트만을 위한 것이 아닙니다. 같은 인터페이스를 만족하기 때문에, 컨트롤러 단계부터 끝까지 흐르는 통합 테스트도 memory 드라이버 위에서 그린 상태를 유지합니다. CI에서 PostgreSQL을 띄우지 않고도 도메인 통합 흐름을 보장할 수 있습니다.

### 같은 인터페이스, 다른 구현

각 드라이버는 같은 메서드 시그니처를 가지지만 내부 구현은 완전히 다릅니다.

```
MemoryRepository      → Map<string, Entity>로 상태 보관
FileRepository        → JSON 파일을 읽고 쓰는 fs 호출
PostgresRepository    → raw pg 클라이언트로 SQL 실행
```

이 구조가 가능한 이유는 Service가 인터페이스만 알기 때문입니다. 셋 중 어떤 게 주입되어도 Service는 차이를 느끼지 않습니다.

<br />

## Strangler Fig Pattern

### 한 번에 갈아엎지 않은 이유

해커톤 MVP는 모르는 사이에 도메인 규칙을 가지고 있습니다. 한 번에 다시 쓰면 그 규칙들이 같이 사라질 위험이 있고, 그 위험을 통째로 짊어지기에는 시간이 부족합니다.

대신 SIMVEX는 도메인 단위로 신규 구현이 레거시를 대체하고, 그동안 두 코드가 같은 저장소에서 공존하도록 만들었습니다.

### 이관 순서의 근거

| 순서 | 도메인 | 상태 | 선택 근거 |
| --- | --- | --- | --- |
| 1 | `memos` | Applied | 가장 단순 — 4-layer 기준 사례로 사용 |
| 2 | `workflow / Node · Connection` | Applied | 도메인 분리의 첫 시험대 |
| 3 | `ai` | Applied | 외부 의존성(LLM)을 인터페이스 뒤로 |
| 4 | `models` | Applied | 3D 모델 메타데이터 |
| 5 | `exam` | Applied | 채점 규칙이 가장 복잡 — Service 계층의 무게중심 |
| 6 | `workflow / File (multipart)` | In progress | 파일 업로드 흐름, 가장 어렵게 남겨둠 |

가장 단순한 도메인부터 옮긴 이유는 기준 사례를 먼저 만들기 위해서입니다. memos가 4-layer를 한 번 통과하면, 다른 도메인은 그 패턴을 따라가기만 하면 됩니다.

<br />

## 트레이드오프

### 단순한 도메인일수록 비용이 크게 보임

| 도메인 | 4-layer 코드 / 레거시 비율 |
| --- | --- |
| `memos` | 약 8배 |
| `workflow` | 약 2.5배 |

memos는 CRUD만 있는 가장 단순한 도메인이지만, 4-layer를 따르면서 레거시 대비 코드가 8배로 늘었습니다. 단순한 도메인일수록 보일러플레이트 비율이 커진다는 사실을 수치로 확인했습니다.

### 드라이버 셋을 유지하는 비용

`memory` · `file` · `postgres` 모두 같은 인터페이스를 만족해야 합니다. 메서드를 하나 늘리면 셋을 다 손봐야 한다는 뜻입니다. 이 비용을 감수한 이유는 통합 테스트의 그린 상태 유지가 더 큰 가치라고 판단했기 때문입니다.

<br />

## 의사결정 요약

| 결정 | 이유 |
| --- | --- |
| 4-Layer Clean Architecture | 도메인을 외부에서 분리해 테스트 가능성과 변경 안전성을 확보 |
| Repository Driver Pattern | 영속성을 인터페이스로 추상화해 통합 테스트가 외부 DB 없이도 그린 |
| Strangler Fig Pattern | 레거시를 멈추지 않은 채 도메인 단위로 점진 이관 |
| 공통 타입 패키지(`@simvex/shared`) | 프론트/백 사이 API 계약을 단일 진실 소스로 유지 |
| Fastify 스키마 검증 | 잘못된 요청을 컨트롤러 이전에 차단 |
<br />
