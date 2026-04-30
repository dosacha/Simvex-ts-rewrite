import type { ExamSubmitRequest } from "@simvex/shared";

/**
 * parseModelIds — 콤마로 구분된 modelId 문자열을 정수 배열로 변환.
 * 비어있거나 정수가 0개면 ExamInputError throw.
 */
export function parseModelIds(idsText: string | undefined): number[] {
    // 1. idsText 없거나 trim 후 빈 문자열이면 throw
    const trimmed = idsText?.trim();
    if (!trimmed) {
        throw new ExamInputError("modelIds 쿼리가 필요합니다.");
    }

    // 2. 콤마로 split → trim → Number → Number.isInteger 필터
    const modelIds = trimmed
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((value) => Number.isInteger(value));

    // 3. 결과 배열이 0개면 throw
    if (modelIds.length === 0) {
        throw new ExamInputError("유효한 modelIds가 없습니다.");
    }

    return modelIds;

}

/**
 * parseCount — count 쿼리 값을 정수로 변환. 기본값 20.
 * 양수 정수가 아니면 기본값 20 사용.
 */
export function parseCount(countRaw: string | number | undefined): number {
    const parsed = Number(countRaw);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 20;
}

/**
 * calculateScore — 정답 수 / 전체 수 * 100 반올림.
 * total === 0 이면 0.
 */
export function calculateScore(correctCount: number, total: number): number {
    // 0 / 0 처리
    if(total === 0) return 0;

    return Math.round((correctCount / total) * 100)
}

/**
 * validateAnswers — answers 가 배열인지 검증. 아니면 ExamInputError throw.
 */
export function validateAnswers(answers: unknown): asserts answers is ExamSubmitRequest["answers"] {
    if (!Array.isArray(answers)) {
        throw new ExamInputError("answers 배열이 필요합니다.");
    }
}

/**
 * exam 도메인의 입력 검증 에러 — controller 에서 400 으로 변환.
 * sentinel 패턴 (instanceof) 으로 처리.
 */
export class ExamInputError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ExamInputError";
    }
}