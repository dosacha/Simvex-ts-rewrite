import type { FastifyInstance } from "fastify";
import type { WorkflowController } from "./workflow.controller";

export async function registerWorkflowRoutesV2(
    app: FastifyInstance,
    controller: WorkflowController
) {
    // POST /v2/workflow/nodes
    app.post<{ Body: { title?: string; content?: string; x?: number; y?: number } }>(
        "/v2/workflow/nodes",
        (request, reply) => controller.createNode(request, reply)
    );
    
    // PUT /v2/workflow/nodes/:id
    app.put<{ 
        Params: { id: string }; 
        Body: { title?: string; content?: string; x?: number; y?: number } 
    }>(
        "/v2/workflow/nodes/:id",
        (request, reply) => controller.updateNode(request, reply)
    );

    // DELETE /v2/workflow/nodes/:id
    app.delete<{ Params: { id: string } }>(
        "/v2/workflow/nodes/:id",
        (request, reply) => controller.deleteNode(request, reply)
    );

     // POST /v2/workflow/connections
    app.post<{ Body: { from?: number; to?: number; fromAnchor?: string; toAnchor?: string } }>(
        "/v2/workflow/connections",
        (request, reply) => controller.createConnection(request, reply)
    );
    
    // DELETE /v2/workflow/connections
    app.delete<{ Querystring: { id?: string; from?: string; to?: string } }>(
        "/v2/workflow/connections",
        (request, reply) => controller.deleteConnection(request, reply)
    );
}