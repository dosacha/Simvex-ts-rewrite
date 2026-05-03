/**
 * Memo 라우트의 JSON Schema 정의.
 *
 * 책임 분리 (전 도메인 공통 패턴):
 *   - schema (이 파일)   = 형식 검증 (필수 필드, 타입, 길이) — 1차 방어
 *   - entity             = 도메인 규칙 검증 — 2차 방어 (있는 도메인만)
 *   - repository         = 권한 격리 (user_id 조건) — 3차 방어
 *
 * 단, memo 는 도메인 규칙이 본질적으로 권한 격리 외에 없어서
 * entity 레이어가 비어있다. workflow connection (from !== to 검증) 처럼
 * 도메인 규칙이 풍부해지면 entity 가 추가될 자리.
 *
 * 명명 규칙: {라우트동작}{Body|Params}Schema
 */

/** PUT /v2/memos/:id — params */
export const updateMemoParamsSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "string", pattern: "^[0-9]+$" },
  },
} as const;

/**
 * PUT /v2/memos/:id — body
 *
 * 정책: title, content 모두 optional 이지만 최소 하나는 와야 한다.
 * minProperties: 1 로 빈 body 거부 → 서비스의 "nothing to update" 검증을 schema 로 이동.
 *
 * 길이 제한도 schema 로 흡수 → 서비스 계층의 길이 검증 제거 가능.
 */
export const updateMemoBodySchema = {
  type: "object",
  minProperties: 1,
  additionalProperties: false,
  properties: {
    title: { type: "string", minLength: 1, maxLength: 200 },
    content: { type: "string", maxLength: 10000 },
  },
} as const;

/** DELETE /v2/memos/:id — params (update 와 동일 모양이지만 의미 분리 위해 별도 export) */
export const deleteMemoParamsSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "string", pattern: "^[0-9]+$" },
  },
} as const;

/** GET /v2/models/:id/memos — params */
export const listMemosByModelParamsSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "string", pattern: "^[0-9]+$" },
  },
} as const;

/** POST /v2/models/:id/memos — params */
export const createMemoInModelParamsSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "string", pattern: "^[0-9]+$" },
  },
} as const;

/**
 * POST /v2/models/:id/memos — body
 *
 * 정책: title, content 둘 다 required.
 * 리뷰 문서 P0 데이터 손상 가능성 (?? "" fallback) 을 schema 로 차단.
 */
export const createMemoInModelBodySchema = {
  type: "object",
  required: ["title", "content"],
  additionalProperties: false,
  properties: {
    title: { type: "string", minLength: 1, maxLength: 200 },
    content: { type: "string", maxLength: 10000 },
  },
} as const;

/**
 * Memo response schema (성공 응답만 정의).
 *
 * 정책:
 *   - 성공 응답 (200, 201) 만 schema 로 보장 → API 계약의 일관성 정량 보장
 *   - 에러 응답 (400, 401, 404, 500) 은 Fastify 의 표준 에러 형식 그대로 사용
 *   - shared 의 MemoItem type 과 일치 (단일 진실 원칙)
 *
 * Fastify 의 response schema 는 응답 직렬화 시 사용 — schema 와 어긋나는 필드는 제외됨.
 * 즉 schema 가 응답의 화이트리스트 역할 (보안 보강).
 */

/** 단일 memo 응답 (POST 201, PUT 200) */
export const memoResponseSchema = {
  type: "object",
  required: ["id", "title", "content"],
  properties: {
    id: { type: "integer" },
    title: { type: "string" },
    content: { type: "string" },
  },
} as const;

/** memo 배열 응답 (GET list 200) */
export const memoListResponseSchema = {
  type: "array",
  items: memoResponseSchema,
} as const;