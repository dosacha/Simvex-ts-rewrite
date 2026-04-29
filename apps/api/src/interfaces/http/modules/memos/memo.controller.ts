import type { FastifyRequest, FastifyReply } from "fastify";
import type { MemoService } from "../../../../application/memos/memo.service";

export class MemoController {
  constructor(private readonly service: MemoService) {}
  
  async updateMemo(request: FastifyRequest, reply: FastifyReply) {
    // 1. request에서 입력 추출
    //    - id (URL params)
    //    - userId (header)
    //    - title, content (body, 선택적)
    
    // 2. 입력 형식 검증 (id가 정수인지 등)
    //    - 잘못되면 reply.code(400).send(...)
    
    // 3. service.updateMemo 호출
    //    - try/catch — service의 throw 를 4xx로 변환
    
    // 4. 결과에 따라 응답
    //    - null이면 404
    //    - 성공이면 200 + 결과
  }
}