/**
 * AI 라우트의 JSON Schema 정의.
 *
 * 책임 분리:
 *   - schema = 형식 검증 (필수 필드, 타입, 길이)
 *   - entity (AiInputValidationError) = 도메인 비즈니스 규칙 검증을 위한 sentinel
 *
 * 현재는 형식 검증이 모두 schema 로 이동했지만,
 * AiInputValidationError 클래스 자체는 향후 비즈니스 규칙 추가 시 재사용 위해 도메인에 유지.
 */

/**
 * POST /v2/ai/ask — body
 *
 * 정책: question, modelId 모두 required.
 * meshName 은 optional (있으면 부품 모드, 없으면 글로벌 모드 — 비즈니스 의미 차이).
 */
export const askQuestionBodySchema = {
  type: "object",
  required: ["question", "modelId"],
  additionalProperties: false,
  properties: {
    question: { type: "string", minLength: 1, maxLength: 2000 },
    modelId: { type: "integer" },
    meshName: { type: "string", minLength: 1, maxLength: 200 },
  },
} as const;

/** GET /v2/ai/history/:modelId — params */
export const listHistoryParamsSchema = {
  type: "object",
  required: ["modelId"],
  properties: {
    modelId: { type: "string", pattern: "^[0-9]+$" },
  },
} as const;