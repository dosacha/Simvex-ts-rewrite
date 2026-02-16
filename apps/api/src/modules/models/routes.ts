import type { FastifyInstance } from "fastify";
import { findModelById, findPartsByModelId, getCatalogStore } from "../../core/catalog";
import { createMemo, listMemos } from "../../core/session-store";

export async function registerModelRoutes(app: FastifyInstance) {
  app.get("/api/models", async () => getCatalogStore().models);

  app.get<{ Params: { id: string } }>("/api/models/:id", async (request, reply) => {
    const id = Number(request.params.id);
    if (!Number.isInteger(id)) return reply.code(400).send({ message: "유효한 모델 ID가 아닙니다." });

    const model = findModelById(id);
    if (!model) return reply.code(404).send({ message: "모델을 찾을 수 없습니다." });

    return model;
  });

  app.get<{ Params: { id: string } }>("/api/models/:id/parts", async (request, reply) => {
    const id = Number(request.params.id);
    if (!Number.isInteger(id)) return reply.code(400).send({ message: "유효한 모델 ID가 아닙니다." });

    const model = findModelById(id);
    if (!model) return reply.code(404).send({ message: "모델을 찾을 수 없습니다." });

    return findPartsByModelId(id);
  });

  app.get("/api/models/:id/quizzes", async () => []);
  app.get("/api/models/exam", async () => []);

  app.get<{ Params: { id: string } }>("/api/models/:id/memos", async (request, reply) => {
    const id = Number(request.params.id);
    if (!Number.isInteger(id)) return reply.code(400).send({ message: "유효한 모델 ID가 아닙니다." });

    const model = findModelById(id);
    if (!model) return reply.code(404).send({ message: "모델을 찾을 수 없습니다." });

    const userId = String(request.headers["x-user-id"] ?? "default-guest");
    return listMemos(userId, id);
  });

  app.post<{ Params: { id: string }; Body: { title?: string; content?: string } }>(
    "/api/models/:id/memos",
    async (request, reply) => {
      const id = Number(request.params.id);
      if (!Number.isInteger(id)) return reply.code(400).send({ message: "유효한 모델 ID가 아닙니다." });

      const model = findModelById(id);
      if (!model) return reply.code(404).send({ message: "모델을 찾을 수 없습니다." });

      const userId = String(request.headers["x-user-id"] ?? "default-guest");
      const memo = createMemo(userId, id, {
        title: request.body?.title ?? "",
        content: request.body?.content ?? "",
      });
      return reply.code(201).send(memo);
    },
  );
}
