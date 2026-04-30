import type { FastifyInstance } from "fastify";
import type { MemoController } from "./memo.controller";

export async function registerMemoRoutesV2(app: FastifyInstance, controller: MemoController) {
    app.put<{ Params: { id: string } }>("/v2/memos/:id", (request, reply) => controller.updateMemo(request, reply));
    app.delete<{ Params: { id: string } }>("/v2/memos/:id", (request, reply) => controller.deleteMemo(request, reply));
    app.get<{ Params: { id: string } }>(
        "/v2/models/:id/memos",
        (request, reply) => controller.listMemosByModel(request, reply),
    );
    app.post<{ 
        Params: { id: string }; 
        Body: { title?: string; content?: string };
    }>(
        "/v2/models/:id/memos",
        (request, reply) => controller.createMemoInModel(request, reply),
    );
}