import type { MemoRepository } from "../../domain/memos/memo.repository";
import type { MemoItem } from "@simvex/shared";
import { findModelById } from "../../core/catalog";
import { ModelNotFoundError } from "../../domain/shared/errors";

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
     * createInModel — 특정 모델에 메모 생성.
     * modelId 검증 + payload 정제 (기존 v1 동작 보존: title/content 빈 문자열 fallback).
     */
    async createInModel(input: {
        userId: string;
        modelId: number;
        title?: string;
        content?: string;
    }): Promise<MemoItem> {
        const model = findModelById(input.modelId);
        if (!model) {
            throw new ModelNotFoundError(input.modelId);
        }
        return this.repo.create(input.userId, input.modelId, {
            title: input.title ?? "",
            content: input.content ?? "",
        });
    }
}