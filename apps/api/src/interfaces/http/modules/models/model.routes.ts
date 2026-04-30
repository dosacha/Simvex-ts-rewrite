import type { FastifyInstance } from "fastify";
import type { ModelController } from "./model.controller";

export async function registerModelRoutesV2(app: FastifyInstance, controller: ModelController) {
  app.get("/v2/models", () => controller.listModels());

  app.get<{ Params: { id: string } }>(
    "/v2/models/:id",
    (request, reply) => controller.findModel(request, reply),
  );

  app.get<{ Params: { id: string } }>(
    "/v2/models/:id/parts",
    (request, reply) => controller.listParts(request, reply),
  );

  app.get<{ Params: { id: string } }>(
    "/v2/models/:id/quizzes",
    (request, reply) => controller.listQuizzes(request, reply),
  );
}
