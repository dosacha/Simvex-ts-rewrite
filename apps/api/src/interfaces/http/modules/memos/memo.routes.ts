import type { FastifyInstance } from "fastify";
import type { MemoController } from "./memo.controller";
import {
    updateMemoParamsSchema,
    updateMemoBodySchema,
    deleteMemoParamsSchema,
    listMemosByModelParamsSchema,
    createMemoInModelParamsSchema,
    createMemoInModelBodySchema,
} from "./memo.schema";

export async function registerMemoRoutesV2(app: FastifyInstance, controller: MemoController) {
    app.put<{ Params: { id: string }; Body: { title?: string; content?: string } }>(
        "/v2/memos/:id",
        {
            schema: {
                params: updateMemoParamsSchema,
                body: updateMemoBodySchema,
            },
        },
        (request, reply) => controller.updateMemo(request, reply),
    );

    app.delete<{ Params: { id: string } }>(
        "/v2/memos/:id",
        {
            schema: {
                params: deleteMemoParamsSchema,
            },
        },
        (request, reply) => controller.deleteMemo(request, reply),
    );

    app.get<{ Params: { id: string } }>(
        "/v2/models/:id/memos",
        {
            schema: {
                params: listMemosByModelParamsSchema,
            },
        },
        (request, reply) => controller.listMemosByModel(request, reply),
    );

    app.post<{ Params: { id: string }; Body: { title: string; content: string } }>(
        "/v2/models/:id/memos",
        {
            schema: {
                params: createMemoInModelParamsSchema,
                body: createMemoInModelBodySchema,
            },
        },
        (request, reply) => controller.createMemoInModel(request, reply),
    );
}