export type { ModelSummary, PartSummary, QuizItem } from "@simvex/shared";
export { ModelNotFoundError } from "../shared/errors";

/**
 * stripAnswerFromQuiz — QuizItem 에서 answer 필드를 제거하여 클라이언트 응답용 DTO 로 변환.
 *
 * answer 노출 금지는 클라이언트에 정답 노출 방지의 비즈니스 규칙 (보안).
 * 단순 DTO 변환이 아니라 비즈니스 의도가 있는 변환이므로 entity 자리.
 */
export function stripAnswerFromQuiz<T extends { answer?: number }>(
  quiz: T,
): Omit<T, "answer"> {
  const { answer: _answer, ...rest } = quiz;
  return rest;
}
