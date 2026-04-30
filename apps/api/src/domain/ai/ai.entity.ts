import type { AiAskResponse } from "@simvex/shared";
export type { AiHistoryItem } from "@simvex/shared";

/**
 * buildAnswer — 질문 + 모델 정보로 모의 AI 답변을 생성하는 순수 비즈니스 규칙.
 *
 * 현재는 mock 응답이지만 미래에 진짜 AI API 호출로 바뀌면
 * service 가 외부 API 호출 + entity 의 검증/로직만 사용하는 형태로 진화할 자리.
 */
export function buildAnswer(
    question: string,
    modelTitle: string,
    partName?: string,
): string {
    if (partName) {
        return `질문을 확인했습니다. "${partName}" 부품 기준으로 설명하면, ${modelTitle} 모델에서 이 부품의 구조와 동작 맥락을 함께 봐야 정확합니다. (${question})`;
    }
    return `질문을 확인했습니다. ${modelTitle} 모델 기준으로 핵심 개념부터 정리하면 이해가 빠릅니다. (${question})`;
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
 * AiInputValidationError — AI 도메인 입력 검증 실패 시 던지는 sentinel.
 *
 * 현재 형식 검증은 schema 가 처리하므로 이 sentinel 의 사용처가 줄었다.
 * 그러나 향후 비즈니스 규칙 (예: rate limiting, 동일 질문 중복 방지 등) 이 추가될 때
 * 같은 sentinel 을 재사용할 수 있도록 클래스 자체는 유지.
 *
 * controller 가 instanceof 로 잡아 400 으로 변환.
 */
export class AiInputValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AiInputValidationError";
    }
}