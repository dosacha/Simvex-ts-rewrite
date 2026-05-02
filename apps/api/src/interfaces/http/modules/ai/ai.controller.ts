import type { FastifyRequest, FastifyReply } from "fastify";
import type { AiAskResponse } from "@simvex/shared";
import type { AiService } from "../../../../application/ai/ai.service";
import { ModelNotFoundError } from "../../../../domain/shared/errors";
export class AiController {
    constructor(private readonly service: AiService) {}

    /**
     * POST /v2/ai/ask
     * schema 가 question/modelId 를 required + 길이/타입 보장.
     * meshName 은 optional 그대로 — 부품 모드 / 글로벌 모드 분기는 비즈니스 의미.
     */
    async askQuestion(
        request: FastifyRequest<{
            Body: { question: string; modelId: number; meshName?: string };
        }>,
        reply: FastifyReply,
    ) {
        const userId = request.userId;
        const { question, modelId, meshName } = request.body;

        try {
            const result = await this.service.askQuestion({
                userId,
                question,
                modelId,
                ...(meshName !== undefined && { meshName }),
            });
            return result;
        } catch (error) {
            if (error instanceof ModelNotFoundError) {
                return reply.code(404).send(this.buildErrorResponse("model not found"));
            }
            request.log.error({ err: error }, "ai ask failed");
            return reply.code(500).send(this.buildErrorResponse("ai service unavailable"));
        }
    }

    /**
     * GET /v2/ai/history/:modelId
     * schema 가 params.modelId 의 숫자 패턴을 보장.
     */
    async listHistory(
        request: FastifyRequest<{ Params: { modelId: string } }>,
        reply: FastifyReply,
    ) {
        const modelId = Number(request.params.modelId);
        const userId = request.userId;

        try {
            return await this.service.listHistory({ userId, modelId });
        } catch (error) {
            if (error instanceof ModelNotFoundError) {
                return reply.code(404).send({ message: "모델을 찾을 수 없습니다." });
            }
            const message = error instanceof Error ? error.message : "잘못된 요청입니다.";
            return reply.code(400).send({ message });
        }
    }

    /** 모든 에러 응답에 동일한 AiAskResponse 모양을 유지하는 helper */
    private buildErrorResponse(error: string): AiAskResponse {
        return { answer: "", context: "", mode: "PART", meta: { error } };
    }
}