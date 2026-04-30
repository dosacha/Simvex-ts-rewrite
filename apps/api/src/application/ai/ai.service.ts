import type { AiHistoryRepository } from "../../domain/ai/ai.repository";
import type { AiAskResponse, AiHistoryItem } from "@simvex/shared";
import { buildAskContext, buildAnswer } from "../../domain/ai/ai.entity";
import { ModelNotFoundError } from "../../domain/shared/errors";
import { findModelById, findPartsByModelId } from "../../core/catalog";

export class AiService {
    constructor(private readonly repo: AiHistoryRepository) {}

    /**
     * askQuestion — schema 가 question/modelId 를 required + 형식 검증한 뒤 호출.
     *
     * 책임: 모델 조회 → 부품 조회 → context/answer 생성 → 히스토리 저장.
     * 비책임: 입력 형식 검증 (schema 가 처리).
     */
    async askQuestion(input: {
        userId: string;
        question: string;
        modelId: number;
        meshName?: string;
    }): Promise<AiAskResponse> {
        // 1. 모델 조회
        const model = findModelById(input.modelId);
        if (!model) {
            throw new ModelNotFoundError(input.modelId);
        }

        // 2. 부품 조회 + context/mode 생성 (entity 함수)
        const parts = findPartsByModelId(input.modelId);
        const part = parts.find((item) => item.meshName === input.meshName);
        const { context, mode, partFound } = buildAskContext(model.title, part);

        // 3. 답변 생성 (entity 함수)
        const answer = buildAnswer(input.question, model.title, part?.meshName);

        // 4. 히스토리 저장
        await this.repo.append(input.userId, input.modelId, { question: input.question, answer });

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
     * controller 가 아닌 service 계층에서 수행.
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