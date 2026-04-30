/**
 * Memo 라우트의 JSON Schema 정의.
 *
 * 책임:
 *   - body / params / querystring 의 런타임 검증 (Fastify 가 ajv 로 자동 처리)
 *   - 검증 실패 시 Fastify 가 자동으로 400 반환
 *
 * 비책임:
 *   - 비즈니스 규칙 (소유권, 도메인 규칙) — 그건 service 계층 책임
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