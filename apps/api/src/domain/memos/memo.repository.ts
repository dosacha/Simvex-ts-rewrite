import type { MemoItem } from "@simvex/shared";

export interface MemoRepository {
  listByModel(userId: string, modelId: number): Promise<MemoItem[]>;
  create(userId: string, modelId: number, payload: Pick<MemoItem, "title" | "content">): Promise<MemoItem>;
  update(userId: string, memoId: number, payload: Partial<Pick<MemoItem, "title" | "content">>): Promise<MemoItem | null>;
  delete(userId: string, memoId: number): Promise<boolean>;
}