import type { FastifyInstance } from "fastify";
import type { AiAskRequest, AiAskResponse } from "@simvex/shared";
import { findModelById, findPartsByModelId } from "../../core/catalog";
import { repositories } from "../../core/repository";

function buildAnswer(question: string, modelTitle: string, partName?: string): string {
  if (partName) {
    return `질문을 확인했습니다. \"${partName}\" 부품 기준으로 설명하면, ${modelTitle} 모델에서 이 부품은 구조와 동작 맥락을 함께 봐야 정확합니다. (${question})`;
  }
  return `질문을 확인했습니다. ${modelTitle} 모델 기준으로 핵심 개념부터 정리하면 이해가 빠릅니다. (${question})`;
}

export async function registerAiRoutes(app: FastifyInstance) {
  app.get<{ Params: { modelId: string } }>("/api/ai/history/:modelId", async (request, reply) => {
    const modelId = Number(request.params.modelId);
    if (!Number.isInteger(modelId)) return reply.code(400).send({ message: "유효한 모델 ID가 아닙니다." });

    const model = findModelById(modelId);
    if (!model) return reply.code(404).send({ message: "모델을 찾을 수 없습니다." });

    const userId = String(request.headers["x-user-id"] ?? "default-guest");
    return await repositories.aiHistory.listByModel(userId, modelId);
  });

  app.post<{ Body: AiAskRequest }>("/api/ai/ask", async (request, reply) => {
    const question = request.body?.question?.trim();
    if (!question) {
      return reply.code(400).send({
        answer: "",
        context: "",
        mode: "PART",
        meta: { error: "question is required" },
      });
    }

    const modelId = request.body.modelId;
    if (!modelId || !Number.isInteger(modelId)) {
      return reply.code(400).send({
        answer: "",
        context: "",
        mode: "PART",
        meta: { error: "modelId is required" },
      });
    }

    const model = findModelById(modelId);
    if (!model) {
      return reply.code(404).send({
        answer: "",
        context: "",
        mode: "PART",
        meta: { error: "model not found" },
      });
    }

    try {
      const parts = findPartsByModelId(modelId);
      const part = parts.find((item) => item.meshName === request.body.meshName);
      const mode: AiAskResponse["mode"] = part ? "PART" : "GLOBAL";
      const context = part
        ? `- model: ${model.title}\n- part: ${part.meshName}\n- description: ${part.content.description ?? ""}`
        : `- model: ${model.title}`;

      const answer = buildAnswer(question, model.title, part?.meshName);
      const userId = String(request.headers["x-user-id"] ?? "default-guest");
      await repositories.aiHistory.append(userId, modelId, { question, answer });

      return {
        answer,
        context,
        mode,
        meta: {
          provider: "mock",
          partFound: Boolean(part),
        },
      };
    } catch (error) {
      request.log.error({ err: error }, "ai ask failed");
      return reply.code(502).send({
        answer: "",
        context: "",
        mode: "PART",
        meta: { error: "ai service unavailable" },
      });
    }
  });
}
