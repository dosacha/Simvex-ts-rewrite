import type { FastifyInstance } from "fastify";
import type { AiController } from "./ai.controller";
import { askQuestionBodySchema, listHistoryParamsSchema } from "./ai.schema";

export async function registerAiRoutesV2(app: FastifyInstance, controller: AiController) {
    app.post<{ Body: { question: string; modelId: number; meshName?: string } }>(
        "/v2/ai/ask",
        {
            schema: { body: askQuestionBodySchema },
        },
        (request, reply) => controller.askQuestion(request, reply),
    );

    app.get<{ Params: { modelId: string } }>(
        "/v2/ai/history/:modelId",
        {
            schema: { params: listHistoryParamsSchema },
        },
        (request, reply) => controller.listHistory(request, reply),
    );
}