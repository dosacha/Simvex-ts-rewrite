import type { FastifyRequest, FastifyReply } from "fastify";
import type { WorkflowService } from "../../../../application/workflow/workflow.service";

export class WorkflowController {
  constructor(private readonly service: WorkflowService) {}
  
    async createNode(
        request: FastifyRequest<{ Body: { title?: string; content?: string; x?: number; y?: number } }>,
        reply: FastifyReply
    ) {
        const userId = String(request.headers["x-user-id"] ?? "default-guest");
        
        const body = request.body;
        
        try {
            const node = await this.service.createNode({
            userId,
            title: body?.title ?? "새 노드",
            content: body?.content ?? "",
            x: body?.x ?? 200,
            y: body?.y ?? 120,
            });
            
            return reply.code(201).send({ id: node.id });
        } catch (error) {
            const message = error instanceof Error ? error.message : "잘못된 요청입니다.";
            return reply.code(400).send({ message });
        }
    }

    async updateNode(
        request: FastifyRequest<{ 
            Params: { id: string }; 
            Body: { title?: string; content?: string; x?: number; y?: number } 
        }>,
        reply: FastifyReply
    ) {
        const nodeId = Number(request.params.id);
        if (!Number.isInteger(nodeId)) {
            return reply.code(400).send({ message: "유효한 노드 ID가 아닙니다." });
        }
        
        const userId = String(request.headers["x-user-id"] ?? "default-guest");
        
        const body = request.body;
        const title = body?.title;
        const content = body?.content;
        const x = body?.x;
        const y = body?.y;
        
        try {
            const updated = await this.service.updateNode({
            userId,
            nodeId,
            ...(title !== undefined && { title }),
            ...(content !== undefined && { content }),
            ...(x !== undefined && { x }),
            ...(y !== undefined && { y }),
            });
            
            if (updated === null) {
            return reply.code(404).send({ message: "노드를 찾을 수 없습니다." });
            }
            
            return reply.code(200).send(updated);
        } catch (error) {
            const message = error instanceof Error ? error.message : "잘못된 요청입니다.";
            return reply.code(400).send({ message });
        }
    }

    async deleteNode(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ) {
        const nodeId = Number(request.params.id);
        if (!Number.isInteger(nodeId)) {
            return reply.code(400).send({ message: "유효한 노드 ID가 아닙니다." });
        }
        
        const userId = String(request.headers["x-user-id"] ?? "default-guest");
        
        try {
            const deleted = await this.service.deleteNode({ userId, nodeId });
            if (!deleted) {
            return reply.code(404).send({ message: "노드를 찾을 수 없습니다." });
            }
            return reply.code(204).send();
        } catch (error) {
            const message = error instanceof Error ? error.message : "잘못된 요청입니다.";
            return reply.code(400).send({ message });
        }
    }

    async createConnection(
        request: FastifyRequest<{ 
            Body: { from?: number; to?: number; fromAnchor?: string; toAnchor?: string } 
        }>,
        reply: FastifyReply
    ) {
        const from = Number(request.body?.from);
        const to = Number(request.body?.to);
        if (!Number.isInteger(from) || !Number.isInteger(to)) {
            return reply.code(400).send({ message: "유효한 연결 정보가 아닙니다." });
        }
        
        const userId = String(request.headers["x-user-id"] ?? "default-guest");
        
        try {
            const connection = await this.service.createConnection({
            userId,
            from,
            to,
            fromAnchor: request.body?.fromAnchor ?? "right",
            toAnchor: request.body?.toAnchor ?? "left",
            });
            
            if (connection === null) {
            return reply.code(400).send({ message: "연결을 만들 수 없습니다." });
            }
            
            return reply.code(201).send(connection);
        } catch (error) {
            const message = error instanceof Error ? error.message : "잘못된 요청입니다.";
            return reply.code(400).send({ message });
        }
    }
}