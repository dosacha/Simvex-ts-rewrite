import type { FastifyRequest, FastifyReply } from "fastify";
import type { WorkflowService } from "../../../../application/workflow/workflow.service";

export class WorkflowController {
    constructor(private readonly service: WorkflowService) {}

    /**
     * POST /v2/workflow/nodes
     * schema 가 title/content/x/y 를 모두 required + 길이 제한까지 보장.
     * controller 는 신뢰된 입력을 service 로 전달.
     */
    async createNode(
        request: FastifyRequest<{
            Body: { title: string; content: string; x: number; y: number };
        }>,
        reply: FastifyReply,
    ) {
        const userId = request.userId;
        const { title, content, x, y } = request.body;

        try {
            const node = await this.service.createNode({ userId, title, content, x, y });
            return reply.code(201).send({ id: node.id });
        } catch (error) {
            // entity 가 도메인 규칙 위반 시 throw — schema 가 잡지 못하는 영역.
            const message = error instanceof Error ? error.message : "잘못된 요청입니다.";
            return reply.code(400).send({ message });
        }
    }

    /**
     * PUT /v2/workflow/nodes/:id
     * schema 가 params.id 패턴 + body 의 minProperties + 길이 제한을 보장.
     */
    async updateNode(
        request: FastifyRequest<{
            Params: { id: string };
            Body: { title?: string; content?: string; x?: number; y?: number };
        }>,
        reply: FastifyReply,
    ) {
        const nodeId = Number(request.params.id);
        const userId = request.userId;
        const { title, content, x, y } = request.body;

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

    /**
     * DELETE /v2/workflow/nodes/:id
     * schema 가 params.id 패턴 보장.
     */
    async deleteNode(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply,
    ) {
        const nodeId = Number(request.params.id);
        const userId = request.userId;

        const deleted = await this.service.deleteNode({ userId, nodeId });
        if (!deleted) {
            return reply.code(404).send({ message: "노드를 찾을 수 없습니다." });
        }
        return reply.code(204).send();
    }

    /**
     * POST /v2/workflow/connections
     * schema 가 from/to/fromAnchor/toAnchor 를 모두 required 로 보장.
     * "from === to" (자기 연결 금지) 는 entity 가 검증.
     */
    async createConnection(
        request: FastifyRequest<{
            Body: { from: number; to: number; fromAnchor: string; toAnchor: string };
        }>,
        reply: FastifyReply,
    ) {
        const userId = request.userId;
        const { from, to, fromAnchor, toAnchor } = request.body;

        try {
            const connection = await this.service.createConnection({
                userId,
                from,
                to,
                fromAnchor,
                toAnchor,
            });
            if (connection === null) {
                return reply.code(404).send({ message: "노드를 찾을 수 없습니다." });
            }
            return reply.code(201).send(connection);
        } catch (error) {
            const message = error instanceof Error ? error.message : "잘못된 요청입니다.";
            return reply.code(400).send({ message });
        }
    }

    /**
     * DELETE /v2/workflow/connections?id=N | ?from=N&to=M
     * schema 가 각 쿼리 값의 숫자 패턴을 보장.
     * "id 또는 from/to 페어 중 하나는 와야 한다" 는 service 가 검증.
     */
    async deleteConnection(
        request: FastifyRequest<{ Querystring: { id?: string; from?: string; to?: string } }>,
        reply: FastifyReply,
    ) {
        const userId = request.userId;
        const { id: idStr, from: fromStr, to: toStr } = request.query;

        const connectionId = idStr !== undefined ? Number(idStr) : undefined;
        const from = fromStr !== undefined ? Number(fromStr) : undefined;
        const to = toStr !== undefined ? Number(toStr) : undefined;

        try {
            const deleted = await this.service.deleteConnectionByIdOrPair({
                userId,
                ...(connectionId !== undefined && { connectionId }),
                ...(from !== undefined && { from }),
                ...(to !== undefined && { to }),
            });
            if (!deleted) {
                return reply.code(404).send({ message: "연결을 찾을 수 없습니다." });
            }
            return reply.code(204).send();
        } catch (error) {
            // service 가 "connectionId 또는 from/to 가 필요합니다" 같은 이유로 throw.
            const message = error instanceof Error ? error.message : "잘못된 요청입니다.";
            return reply.code(400).send({ message });
        }
    }

    async getWorkflow(
        request: FastifyRequest,
        reply: FastifyReply
    ) {
        const userId = String(request.headers["x-user-id"] ?? "default-guest");
        const response = await this.service.getWorkflowForUser(userId);
        return reply.code(200).send(response);
    }
}