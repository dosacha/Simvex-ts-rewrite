import type { AiAskResponse } from "@simvex/shared";
export type { AiHistoryItem } from "@simvex/shared";

/**
 * buildAnswer — 질문 + 모델 정보로 모의 AI 답변을 생성하는 순수 비즈니스 규칙.
 *
 * 현재는 mock 응답이지만, 미래에 진짜 AI API 호출로 바뀌면
 * service 가 외부 API 호출 + entity 의 검증 로직만 사용하는 형태로 진화할 자리.
 */
export function buildAnswer(
  question: string,
  modelTitle: string,
  partName?: string,
): string {
  if (partName) {
    return `질문을 확인했습니다. "${partName}" 부품 기준으로 설명하면, ${modelTitle} 모델에서 이 부품은 구조와 동작 맥락을 함께 봐야 정확합니다. (${question})`;
  }
  return `질문을 확인했습니다. ${modelTitle} 모델 기준으로 핵심 개념부터 정리하면 이해가 빠릅니다. (${question})`;
}

/**
 * validateAskInput — POST /ai/ask 의 입력을 검증하는 entity 함수.
 * question 과 modelId 가 유효한지 확인하고, 정제된 입력을 반환.
 */
export function validateAskInput(input: {
  question?: string;
  modelId?: number;
}): { question: string; modelId: number } {
  const question = input.question?.trim();
  if (!question) {
    throw new AiInputValidationError("question is required");
  }

  const modelId = input.modelId;
  if (!modelId || !Number.isInteger(modelId)) {
    throw new AiInputValidationError("modelId is required");
  }

  return { question, modelId };
}

/**
 * buildAskContext — 모델과 부품 정보로 context 문자열을 생성.
 */
export function buildAskContext(
  modelTitle: string,
  part?: { meshName: string; content: { description?: string } },
): { context: string; mode: AiAskResponse["mode"]; partFound: boolean } {
  if (part) {
    return {
      context: `- model: ${modelTitle}\n- part: ${part.meshName}\n- description: ${part.content.description ?? ""}`,
      mode: "PART",
      partFound: true,
    };
  }
  return {
    context: `- model: ${modelTitle}`,
    mode: "GLOBAL",
    partFound: false,
  };
}

/**
 * validateAskInput 이 throw 하는 입력 검증 에러.
 * controller 에서 400 으로 변환할 자리.
 *
 * 문자열 비교 대신 sentinel 패턴 — entity 의 에러 메시지가 바뀌어도
 * controller 가 안 깨지도록 type 시스템에 정합 의도를 박는 자리.
 */
export class AiInputValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiInputValidationError";
  }
}
