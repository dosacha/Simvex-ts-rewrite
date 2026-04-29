import type { FastifyRequest, FastifyReply } from "fastify";
import type { MemoService } from "../../../../application/memos/memo.service";

export class MemoController {
    constructor(private readonly service: MemoService) {}
    
    async updateMemo(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        // 1. request에서 입력 추출
        //    - id (URL params)
        //    - userId (header)
        //    - title, content (body, 선택적)
        const id = Number(request.params.id);
        if(!Number.isInteger(id)) {
            return reply.code(400).send({message: "유효한 메모 ID가 아닙니다."});
        }
        
        // 2. 입력 형식 검증 (id가 정수인지 등)
        //    - 잘못되면 reply.code(400).send(...)
        const userId = String(request.headers["x-user-id"] ?? "default-guest");

        // 3. service.updateMemo 호출
        //    - try/catch — service의 throw 를 4xx로 변환
        const body = request.body as { title?: string; content?: string} | undefined;
        const title = body?.title;
        const content = body?.content;

        // 4. 결과에 따라 응답
        //    - null이면 404
        //    - 성공이면 200 + 결과
        try {
            const updated = await this.service.updateMemo({
                userId,
                memoId: id,
                ...(title !== undefined && { title }),
                ...(content !== undefined && { content }),
            });
        
            if (updated === null) {
                return reply.code(404).send({ message: "메모를 찾을 수 없습니다." });
            }
        
            return reply.code(200).send(updated);
        } catch (error) {
            // service가 throw한 비즈니스 규칙 위반
            const message = error instanceof Error ? error.message : "잘못된 요청입니다.";
            return reply.code(400).send({ message });
        }
    }

    async deleteMemo(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ) {
        const id = Number(request.params.id);
        if (!Number.isInteger(id)) {
            return reply.code(400).send({ message: "유효한 메모 ID가 아닙니다." });
        }
        
        const userId = String(request.headers["x-user-id"] ?? "default-guest");

        try {
            const deleted = await this.service.deleteMemo({ userId, memoId: id });
            if (!deleted) {
                return reply.code(404).send({ message: "메모를 찾을 수 없습니다." });
            }
            return reply.code(204).send();
        } catch (error) {
            const message = error instanceof Error ? error.message : "잘못된 요청입니다.";
            return reply.code(400).send({ message });
        }    
    }
}