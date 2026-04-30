import type { FastifyRequest, FastifyReply } from "fastify";
import type { MemoService } from "../../../../application/memos/memo.service";
import { ModelNotFoundError } from "../../../../domain/shared/errors";

export class MemoController {
    constructor(private readonly service: MemoService) {}
    
    async updateMemo(
        request: FastifyRequest<{
            Params: { id: string };
            Body: { title?: string; content?: string };
        }>,
        reply: FastifyReply,
    ) {
        // schema 가 params.id (숫자 문자열) 와 body 의 minProperties/maxLength 를 이미 보장.
        // controller 는 신뢰된 입력을 service 로 전달만 한다.
        const memoId = Number(request.params.id);
        const userId = request.userId;
        const { title, content } = request.body;

        const updated = await this.service.updateMemo({
            userId,
            memoId,
            ...(title !== undefined && { title }),
            ...(content !== undefined && { content }),
        });

        if (updated === null) {
            return reply.code(404).send({ message: "메모를 찾을 수 없습니다." });
        }

        return reply.code(200).send(updated);
    }

    async deleteMemo(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply,
    ) {
        const memoId = Number(request.params.id);
        const userId = request.userId;

        const deleted = await this.service.deleteMemo({ userId, memoId });
        if (!deleted) {
            return reply.code(404).send({ message: "메모를 찾을 수 없습니다." });
        }
        return reply.code(204).send();
    }

    async listMemosByModel(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply,
    ) {
        const modelId = Number(request.params.id);
        const userId = request.userId;

        try {
            return await this.service.listByModel({ userId, modelId });
        } catch (error) {
            if (error instanceof ModelNotFoundError) {
                return reply.code(404).send({ message: "모델을 찾을 수 없습니다." });
            }
            throw error;
        }
    }

    async createMemoInModel(
        request: FastifyRequest<{
            Params: { id: string };
            Body: { title: string; content: string };
        }>,
        reply: FastifyReply,
    ) {
        // schema 가 title, content 를 required + 길이 제한까지 모두 보장.
        const modelId = Number(request.params.id);
        const userId = request.userId;
        const { title, content } = request.body;

        try {
            const memo = await this.service.createInModel({ userId, modelId, title, content });
            return reply.code(201).send(memo);
        } catch (error) {
            if (error instanceof ModelNotFoundError) {
                return reply.code(404).send({ message: "모델을 찾을 수 없습니다." });
            }
            throw error;
        }
    }
}