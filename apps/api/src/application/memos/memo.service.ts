import type { MemoRepository } from "../../domain/memos/memo.repository";
import type { MemoItem } from "@simvex/shared";
import { findModelById } from "../../core/catalog";
import { ModelNotFoundError } from "../../domain/shared/errors";

export class MemoService {
  constructor(private readonly repo: MemoRepository) {}
  
    /**
     * updateMemo — schema 가 입력 형식을 보장한 후 호출되는 use case.
     *
     * 책임: 신뢰된 입력으로 repository 호출.
     * 비책임: 입력 형식 검증 (title 빈문자/길이/최소 1개 필드) — schema 가 처리.
     */
    async updateMemo(input: {
        userId: string;
        memoId: number;
        title?: string;
        content?: string;
    }): Promise<MemoItem | null> {
        const payload: { title?: string; content?: string } = {};
        if (input.title !== undefined) payload.title = input.title;
        if (input.content !== undefined) payload.content = input.content;

        return this.repo.update(input.userId, input.memoId, payload);
    }

    async deleteMemo(input: {
        userId: string;
        memoId: number;
    }): Promise<boolean> {
        return this.repo.delete(input.userId, input.memoId);
    }

    /**
     * listByModel — 특정 모델의 사용자 메모 조회.
     * modelId 가 catalog 에 존재하는지 검증 후 repository 조회.
     */
    async listByModel(input: {
        userId: string;
        modelId: number;
    }): Promise<MemoItem[]> {
        const model = findModelById(input.modelId);
        if (!model) {
            throw new ModelNotFoundError(input.modelId);
        }
        return this.repo.listByModel(input.userId, input.modelId);
    }

    /**
     * createInModel — schema 가 title/content 를 required 로 강제한 뒤 호출.
     * 리뷰 문서 P0 데이터 손상 가능성 (?? "" fallback) 을 schema + 타입으로 차단.
     */
    async createInModel(input: {
        userId: string;
        modelId: number;
        title: string;     // ← optional 제거
        content: string;   // ← optional 제거
    }): Promise<MemoItem> {
        const model = findModelById(input.modelId);
        if (!model) {
            throw new ModelNotFoundError(input.modelId);
        }
        return this.repo.create(input.userId, input.modelId, {
            title: input.title,
            content: input.content,
        });
    }
}