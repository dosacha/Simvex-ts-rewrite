import type { FastifyInstance } from "fastify";
import type { MemoController } from "./memo.controller";

export async function registerMemoRoutesV2(app: FastifyInstance, controller: MemoController) {
    app.put<{ Params: { id: string } }>("/v2/memos/:id", (request, reply) => controller.updateMemo(request, reply));
    app.delete<{ Params: { id: string } }>("/v2/memos/:id", (request, reply) => controller.deleteMemo(request, reply));
}