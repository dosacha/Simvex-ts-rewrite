/**
 * Workflow 라우트의 JSON Schema 정의.
 *
 * 책임 분리 (전 도메인 공통 패턴):
 *   - schema (이 파일)   = 형식 검증 (필드 존재, 타입, 길이, 패턴) — 1차 방어
 *   - entity             = 도메인 규칙 검증 (예: connection.from !== connection.to) — 2차 방어
 *   - repository         = 권한 격리 (user_id 조건) — 3차 방어
 *
 * workflow connection 은 from!==to 같은 도메인 규칙이 있어서 entity 가 살아있다.
 * memo 는 도메인 규칙이 권한 격리뿐이라 entity 가 비어있다 (도메인 차이).
 */

// ─── Node 라우트 ────────────────────────────────────────────────────────────

/**
 * POST /v2/workflow/nodes — body
 *
 * 정책: 모든 필드 required.
 * 이전에는 controller 가 fallback (`?? "새 노드"`, `?? 0`) 으로 채웠으나,
 * 이제 클라이언트가 명시적으로 보내야 한다. (P0 fallback 제거)
 */
export const createNodeBodySchema = {
  type: "object",
  required: ["title", "content", "x", "y"],
  additionalProperties: false,
  properties: {
    title: { type: "string", minLength: 1, maxLength: 200 },
    content: { type: "string", maxLength: 10000 },
    x: { type: "number" },
    y: { type: "number" },
  },
} as const;

/** PUT /v2/workflow/nodes/:id — params */
export const updateNodeParamsSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "string", pattern: "^[0-9]+$" },
  },
} as const;

/**
 * PUT /v2/workflow/nodes/:id — body
 *
 * 정책: 모든 필드 optional 이지만 최소 하나 필수 (PATCH 의미).
 * entity 의 "everything is undefined" 검증을 schema 로 이동.
 */
export const updateNodeBodySchema = {
  type: "object",
  minProperties: 1,
  additionalProperties: false,
  properties: {
    title: { type: "string", minLength: 1, maxLength: 200 },
    content: { type: "string", maxLength: 10000 },
    x: { type: "number" },
    y: { type: "number" },
  },
} as const;

/** DELETE /v2/workflow/nodes/:id — params */
export const deleteNodeParamsSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "string", pattern: "^[0-9]+$" },
  },
} as const;

// ─── Connection 라우트 ──────────────────────────────────────────────────────

/**
 * POST /v2/workflow/connections — body
 *
 * 정책: from, to 는 정수. fromAnchor, toAnchor 는 문자열.
 * "from === to" (자기 연결 금지) 는 entity 가 검증 — 도메인 규칙이라 schema 영역 아님.
 */
export const createConnectionBodySchema = {
  type: "object",
  required: ["from", "to", "fromAnchor", "toAnchor"],
  additionalProperties: false,
  properties: {
    from: { type: "integer" },
    to: { type: "integer" },
    fromAnchor: { type: "string", minLength: 1, maxLength: 50 },
    toAnchor: { type: "string", minLength: 1, maxLength: 50 },
  },
} as const;

/**
 * DELETE /v2/workflow/connections — querystring
 *
 * 정책: id 또는 from/to 페어가 와야 함. 두 분기를 모두 허용 (mutually exclusive 강제는 service 가).
 *
 * 형식: 모든 값이 url querystring 으로 들어와 string 이지만, 숫자만 허용 (pattern).
 *
 * "최소 하나 + mutual exclusion" 검증은 service 가 이미 처리.
 * schema 는 형식만 보장.
 */
export const deleteConnectionQuerystringSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: { type: "string", pattern: "^[0-9]+$" },
    from: { type: "string", pattern: "^[0-9]+$" },
    to: { type: "string", pattern: "^[0-9]+$" },
  },
} as const;