import type { FastifyRequest, FastifyReply } from "fastify";
import type { AiAskResponse } from "@simvex/shared";
import type { AiService } from "../../../../application/ai/ai.service";
import { ModelNotFoundError } from "../../../../application/ai/ai.service";

export class AiController {
  constructor(private readonly service: AiService) {}

  async askQuestion(
    request: FastifyRequest<{ Body: { question?: string; modelId?: number; meshName?: string } }>,
    reply: FastifyReply,
  ) {
    const userId = String(request.headers["x-user-id"] ?? "default-guest");

    const question = request.body?.question?.trim();
    const modelId = request.body?.modelId;
    const meshName = request.body?.meshName;

    try {
      const result = await this.service.askQuestion({
        userId,
        ...(question !== undefined && { question }),
        ...(modelId !== undefined && { modelId }),
        ...(meshName !== undefined && { meshName }),
      });
      return result;
    } catch (error) {
      if (error instanceof ModelNotFoundError) {
        return reply.code(404).send(this.buildErrorResponse("model not found"));
      }
      if (error instanceof Error && (error.message === "question is required" || error.message === "modelId is required")) {
        return reply.code(400).send(this.buildErrorResponse(error.message));
      }
      request.log.error({ err: error }, "ai ask failed");
      return reply.code(502).send(this.buildErrorResponse("ai service unavailable"));
    }
  }

  async listHistory(
    request: FastifyRequest<{ Params: { modelId: string } }>,
    reply: FastifyReply,
  ) {
    const modelId = Number(request.params.modelId);
    if (!Number.isInteger(modelId)) {
      return reply.code(400).send({ message: "유효한 모델 ID가 아닙니다." });
    }

    const userId = String(request.headers["x-user-id"] ?? "default-guest");

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
