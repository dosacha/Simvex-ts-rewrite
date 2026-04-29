import type { MemoRepository } from "../../domain/memos/memo.repository";
import type { MemoItem } from "@simvex/shared";

export class MemoService {
  constructor(private readonly repo: MemoRepository) {}
  
    async updateMemo(input: {
        userId: string;
        memoId: number;
        title?: string;
        content?: string;
    }): Promise<MemoItem | null> {
        // 1. 입력 검증 — title 이 주어졌고 빈 문자열이면 거부
        if(input.title !== undefined && input.title.trim().length === 0) {
            throw new Error("memo title cannot be empty");
        }

        // 2. 입력 검증 — title 이 주어졌고 200자 초과면 거부
        if(input.title !== undefined && input.title.length > 200) {
            throw new Error("memo title is too long");
        }

        // 3. 입력 검증 — content 가 주어졌고 10000자 초과면 거부
        if(input.content !== undefined && input.content.length > 10000) {
            throw new Error("memo content is too long");
        }

        // 4. 입력 검증 — title 과 content 둘 다 undefined 면 거부
        if(input.title === undefined && input.content === undefined) {
            throw new Error("nothing to update");
        }

        // 5. payload 구성 — 주어진 필드만 담음
        const payload: {
            title?: string;
            content?: string
        } = {};

        if (input.title !== undefined) payload.title = input.title;
        if (input.content !== undefined) payload.content = input.content;

        // 6. repository.update 호출
        return this.repo.update(input.userId, input.memoId, payload);
    }

    async deleteMemo(input: {
        userId: string;
        memoId: number;
    }): Promise<boolean> {
        return this.repo.delete(input.userId, input.memoId);
    }
}