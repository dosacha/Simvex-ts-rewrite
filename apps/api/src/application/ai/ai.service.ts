import type { AiHistoryRepository } from "../../domain/ai/ai.repository";
import type { AiAskResponse, AiHistoryItem } from "@simvex/shared";
import {
  validateAskInput,
  buildAskContext,
  buildAnswer,
} from "../../domain/ai/ai.entity";
import { ModelNotFoundError } from "../../domain/shared/errors";
// catalog 의존성은 현재 단계에서 service 가 직접 호출.
// 추후 catalog 가 동적 데이터로 진화하면 CatalogRepository 패턴으로 옮길 자리.
import { findModelById, findPartsByModelId } from "../../core/catalog";

export class AiService {
  constructor(private readonly repo: AiHistoryRepository) {}

  /**
   * askQuestion — 질문 입력 검증 → 모델/부품 조회 → 답변 생성 → 히스토리 저장.
   *
   * entity 함수 (validateAskInput, buildAskContext, buildAnswer) 를 호출하여
   * 비즈니스 규칙을 domain 에 위임하고, catalog 조회와 repository 호출을 조율하는 service 자리.
   */
  async askQuestion(input: {
    userId: string;
    question?: string;
    modelId?: number;
    meshName?: string;
  }): Promise<AiAskResponse> {
    // 1. entity 를 통한 입력 검증
    const { question, modelId } = validateAskInput({
      ...(input.question !== undefined && { question: input.question }),
      ...(input.modelId !== undefined && { modelId: input.modelId }),
    });

    // 2. catalog 에서 모델 조회
    const model = findModelById(modelId);
    if (!model) {
      throw new ModelNotFoundError(modelId);
    }

    // 3. 부품 조회 + context/mode 생성 (entity 함수)
    const parts = findPartsByModelId(modelId);
    const part = parts.find((item) => item.meshName === input.meshName);
    const { context, mode, partFound } = buildAskContext(model.title, part);

    // 4. 답변 생성 (entity 함수)
    const answer = buildAnswer(question, model.title, part?.meshName);

    // 5. 히스토리 저장
    await this.repo.append(input.userId, modelId, { question, answer });

    return {
      answer,
      context,
      mode,
      meta: {
        provider: "mock",
        partFound,
      },
    };
  }

  /**
   * listHistory — modelId 가 catalog 에 존재하는지 검증 후 히스토리 조회.
   *
   * modelId 존재 여부 검증은 단순 형식 검증이 아닌 비즈니스 흐름 (catalog 조회) 이므로
   * controller 가 아닌 service 자리에서 수행.
   */
  async listHistory(input: {
    userId: string;
    modelId: number;
  }): Promise<AiHistoryItem[]> {
    const model = findModelById(input.modelId);
    if (!model) {
      throw new ModelNotFoundError(input.modelId);
    }

    return this.repo.listByModel(input.userId, input.modelId);
  }
}

