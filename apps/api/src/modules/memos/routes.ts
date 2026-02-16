import type { FastifyInstance } from "fastify";
import { deleteMemo, updateMemo } from "../../core/session-store";

export async function registerMemoRoutes(app: FastifyInstance) {
  app.put<{ Params: { id: string }; Body: { title?: string; content?: string } }>("/api/memos/:id", async (request, reply) => {
    const id = Number(request.params.id);
    if (!Number.isInteger(id)) return reply.code(400).send({ message: "유효한 메모 ID가 아닙니다." });

    const userId = String(request.headers["x-user-id"] ?? "default-guest");
    const updated = updateMemo(userId, id, {
      title: request.body?.title ?? "",
      content: request.body?.content ?? "",
    });

    if (!updated) return reply.code(404).send({ message: "메모를 찾을 수 없습니다." });
    return updated;
  });

  app.delete<{ Params: { id: string } }>("/api/memos/:id", async (request, reply) => {
    const id = Number(request.params.id);
    if (!Number.isInteger(id)) return reply.code(400).send({ message: "유효한 메모 ID가 아닙니다." });

    const userId = String(request.headers["x-user-id"] ?? "default-guest");
    const deleted = deleteMemo(userId, id);
    if (!deleted) return reply.code(404).send({ message: "메모를 찾을 수 없습니다." });

    return reply.code(204).send();
  });
}
