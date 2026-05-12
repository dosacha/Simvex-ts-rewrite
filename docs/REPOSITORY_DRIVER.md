# Repository Driver Pattern

이 문서는 SIMVEX가 영속성을 추상화한 방식과, 그 추상화를 *드라이버*로 다중화한 이유를 정리합니다.

<br />

## 패턴 정의
| 요소 | 역할 |
| --- | --- |
| **Repository 인터페이스** | Service가 의존하는 단일 계약 |
| **다중 드라이버 구현** | 같은 계약을 만족하는 서로 다른 영속성 구현 |
| **환경 기반 주입** | 실행 시점에 어떤 드라이버를 사용할지 결정 |

<br />

## 인터페이스 설계 원칙

### 1. 도메인 언어로만 표현

인터페이스 메서드 이름과 인자는 *도메인 용어*로만 구성됩니다. `executeQuery`, `selectRow` 같은 영속성 용어는 노출되지 않습니다.

```typescript
interface MemoRepository {
  create(input: CreateMemoInput): Promise<Memo>;
  findById(id: string): Promise<Memo | null>;
  findByUserId(userId: string): Promise<Memo[]>;
  update(id: string, patch: UpdateMemoInput): Promise<Memo>;
  delete(id: string): Promise<void>;
}
```

### 2. 영속성 세부사항 노출 금지

트랜잭션 핸들, 쿼리 객체, 커넥션 풀 같은 객체는 인터페이스 시그니처에 등장하지 않습니다. 이 원칙을 어기는 순간 Service는 특정 드라이버에 묶이게 됩니다.

### 3. 결과 형태는 도메인 객체

조회 결과는 raw row가 아니라 도메인 객체로 반환됩니다. raw → domain 매핑은 Repository 구현 안에서 끝나야 하고, Service가 그 매핑을 알 필요가 없어야 합니다.

<br />

## 세 가지 드라이버
### MemoryRepository

```typescript
class MemoryMemoRepository implements MemoRepository {
  private store = new Map<string, Memo>();

  async create(input: CreateMemoInput): Promise<Memo> {
    const memo = { id: randomUUID(), ...input };
    this.store.set(memo.id, memo);
    return memo;
  }

  async findById(id: string): Promise<Memo | null> {
    return this.store.get(id) ?? null;
  }
  // ...
}
```

`Map`을 그대로 상태로 사용합니다. 프로세스가 끝나면 데이터는 사라집니다. 단위 테스트와 CI에서 사용합니다.

### FileRepository

JSON 파일에 상태를 영속화합니다. 데모 환경에서 데이터가 보존되어야 할 때, 그러나 PostgreSQL을 띄우기는 부담스러운 상황에서 사용합니다.

### PostgresRepository

```typescript
class PostgresMemoRepository implements MemoRepository {
  constructor(private pool: Pool) {}

  async create(input: CreateMemoInput): Promise<Memo> {
    const { rows } = await this.pool.query(
      `INSERT INTO memos (...) VALUES (...) RETURNING *`,
      [/* params */],
    );
    return mapRowToMemo(rows[0]);
  }
  // ...
}
```

raw `pg` 클라이언트로 SQL을 직접 실행합니다. ORM을 사용하지 않은 이유는, **SQL을 숨기지 않고 Repository 안에서만 다루는 정책**을 유지하기 위해서입니다.

<br />

## 드라이버 전환 메커니즘
```bash
$env:SIMVEX_REPOSITORY_DRIVER='memory'   # 단위 테스트 · 로컬 개발
$env:SIMVEX_REPOSITORY_DRIVER='file'     # 데모 · 데이터 보존 시연
$env:SIMVEX_REPOSITORY_DRIVER='postgres' # 통합 테스트 · 실 환경
```

부트스트랩 시점에 환경변수를 읽어 해당 드라이버 구현체를 인스턴스화하고, Service에 주입합니다. Service는 어떤 드라이버가 주입되었는지 알지 못합니다.

<br />

## 통합 테스트와의 관계

| 테스트 종류 | 사용 드라이버 | 외부 의존 |
| --- | --- | --- |
| 단위 테스트 (Service) | memory | 없음 |
| 통합 테스트 (Controller → Service → Repository) | memory | 없음 |
| PostgreSQL 통합 테스트 | postgres | DB 필요 |

컨트롤러 진입부터 Repository까지 흐르는 통합 테스트도 memory 드라이버 위에서 통과합니다. 이 덕분에 CI가 PostgreSQL을 띄우지 않고도 도메인 흐름의 회귀를 잡아냅니다.

PostgreSQL 통합 테스트는 별도 명령(`npm run test:postgres -w @simvex/api`)으로 분리되어, *실제 SQL이 의도대로 작성되었는가*만을 검증하는 좁은 범위로 운영됩니다.

<br />

## 새 메서드 추가 워크플로우

인터페이스에 메서드가 추가되면 세 드라이버를 모두 손봐야 합니다. 이 순서를 지키는 것이 일관성을 보장합니다.

1. Repository **인터페이스**에 메서드 시그니처 추가
2. `MemoryRepository`에 구현 추가
3. `FileRepository`에 구현 추가
4. `PostgresRepository`에 구현 추가 (SQL 작성 + 매핑)
5. 단위 테스트(memory) → 통합 테스트(memory) → PostgreSQL 통합 테스트 순으로 검증

이 순서를 따르면 *가장 빠르게 그린을 확인할 수 있는 단계*부터 차례로 통과시키면서 작업이 진행됩니다.

<br />

## 트레이드오프

### 인터페이스 동조화 부담

메서드를 하나 늘리면 세 드라이버를 모두 손봐야 합니다. 인터페이스를 바꿀 때마다 보일러플레이트 작업이 생긴다는 뜻입니다.

이 비용을 감수한 이유는, *언제든 외부 DB 없이 그린 통합 테스트를 돌릴 수 있다*는 가치가 더 크다고 생각했기 때문입니다.

### 드라이버 사이의 의미 차이

같은 인터페이스라도 드라이버에 따라 *세부 동작*은 미묘하게 다를 수 있습니다. 예를 들어 동시 쓰기 상황에서 `MemoryRepository`는 race condition을 그대로 노출하지만, `PostgresRepository`는 격리 수준에 따라 다르게 동작합니다.

따라서 *동시성에 민감한 시나리오*는 PostgreSQL 통합 테스트에서만 검증해야 합니다. memory 드라이버에서의 그린 상태가 동시성 안전을 의미하지는 않습니다.

### 추상화 누수 위험

영속성 세부사항이 Repository 인터페이스에 새어나오면 패턴 전체가 무너집니다. 트랜잭션 핸들이나 SQL 단편이 시그니처에 등장하는 순간 Service는 PostgreSQL을 알게 되고, memory 드라이버에서는 흉내낼 수 없는 상태가 됩니다.

이 위험은 리뷰 단계에서 인터페이스 시그니처를 별도로 점검하는 규율로 막고 있습니다.

<br />

## Repository Pattern과의 차이

| 항목 | 일반 Repository Pattern | Repository Driver Pattern |
| --- | --- | --- |
| 초점 | 영속성 추상화 | 환경별 전환 |
| 구현체 수 | 보통 1개 (production 용) | 다수 (memory / file / postgres) |
| 테스트 전략 | 보통 mock 객체 사용 | 진짜 구현인 memory 드라이버 사용 |
| 환경 전환 | 별도 메커니즘 필요 | 환경변수로 일급 지원 |

SIMVEX가 mock 대신 memory 드라이버를 채택한 이유는, **mock은 인터페이스만 만족하고 의미는 흉내내지 않기 때문**입니다. memory 드라이버는 진짜 데이터 구조 위에서 동작하기 때문에, mock에서는 잡히지 않는 사용 오류가 그대로 드러납니다.