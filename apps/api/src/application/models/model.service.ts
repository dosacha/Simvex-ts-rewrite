import type { ModelSummary, PartSummary, QuizItem } from "@simvex/shared";
import { stripAnswerFromQuiz } from "../../domain/models/model.entity";
import { ModelNotFoundError } from "../../domain/shared/errors";
// catalog 의존성은 현재 단계에서 service 가 직접 호출.
// 추후 catalog 가 동적 데이터로 진화하면 CatalogRepository 패턴으로 옮길 자리.
import {
  getCatalogStore,
  findModelById,
  findPartsByModelId,
  findQuizzesByModelId,
} from "../../core/catalog";

export class ModelService {
  /** 전체 모델 카탈로그 조회 */
  listModels(): ModelSummary[] {
    return getCatalogStore().models;
  }

  /** 단일 모델 조회 — 미발견 시 ModelNotFoundError throw */
  findModel(modelId: number): ModelSummary {
    const model = findModelById(modelId);
    if (!model) {
      throw new ModelNotFoundError(modelId);
    }
    return model;
  }

  /** 모델 검증 + parts 조회 */
  listParts(modelId: number): PartSummary[] {
    const model = findModelById(modelId);
    if (!model) {
      throw new ModelNotFoundError(modelId);
    }
    return findPartsByModelId(modelId);
  }

  /**
   * 모델 검증 + quizzes 조회 + answer 필드 제거 (entity 함수 호출).
   * answer 노출 금지는 클라이언트에 정답 노출 방지의 비즈니스 규칙.
   */
  listQuizzes(modelId: number): Omit<QuizItem, "answer">[] {
    const model = findModelById(modelId);
    if (!model) {
      throw new ModelNotFoundError(modelId);
    }
    return findQuizzesByModelId(modelId).map(stripAnswerFromQuiz);
  }
}
