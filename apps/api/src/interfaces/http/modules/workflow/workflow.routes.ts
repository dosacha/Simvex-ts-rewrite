import type { FastifyInstance } from "fastify";
import type { WorkflowController } from "./workflow.controller";
import {
    createNodeBodySchema,
    updateNodeParamsSchema,
    updateNodeBodySchema,
    deleteNodeParamsSchema,
    createConnectionBodySchema,
    deleteConnectionQuerystringSchema,
} from "./workflow.schema";

export async function registerWorkflowRoutesV2(
    app: FastifyInstance,
    controller: WorkflowController,
) {
    // POST /v2/workflow/nodes — 노드 생성 (모든 필드 required)
    app.post<{ Body: { title: string; content: string; x: number; y: number } }>(
        "/v2/workflow/nodes",
        {
            schema: { body: createNodeBodySchema },
        },
        (request, reply) => controller.createNode(request, reply),
    );

    // PUT /v2/workflow/nodes/:id — 노드 수정 (PATCH 의미, 최소 1필드)
    app.put<{
        Params: { id: string };
        Body: { title?: string; content?: string; x?: number; y?: number };
    }>(
        "/v2/workflow/nodes/:id",
        {
            schema: {
                params: updateNodeParamsSchema,
                body: updateNodeBodySchema,
            },
        },
        (request, reply) => controller.updateNode(request, reply),
    );

    // DELETE /v2/workflow/nodes/:id
    app.delete<{ Params: { id: string } }>(
        "/v2/workflow/nodes/:id",
        {
            schema: { params: deleteNodeParamsSchema },
        },
        (request, reply) => controller.deleteNode(request, reply),
    );

    // POST /v2/workflow/connections — 연결 생성
    app.post<{ Body: { from: number; to: number; fromAnchor: string; toAnchor: string } }>(
        "/v2/workflow/connections",
        {
            schema: { body: createConnectionBodySchema },
        },
        (request, reply) => controller.createConnection(request, reply),
    );

    // DELETE /v2/workflow/connections — id 또는 from/to 로 삭제
    app.delete<{ Querystring: { id?: string; from?: string; to?: string } }>(
        "/v2/workflow/connections",
        {
            schema: { querystring: deleteConnectionQuerystringSchema },
        },
        (request, reply) => controller.deleteConnection(request, reply),
    );

    app.get("/v2/workflow", (request, reply) => 
        controller.getWorkflow(request, reply)
    );
}