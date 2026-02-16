import type { AiHistoryItem, MemoItem } from "@simvex/shared";

type UserId = string;
type ModelId = number;

const memoStore = new Map<UserId, Map<ModelId, MemoItem[]>>();
const historyStore = new Map<UserId, Map<ModelId, AiHistoryItem[]>>();
let memoIdSeq = 1;

function ensureUserModelMemoBucket(userId: UserId, modelId: ModelId): MemoItem[] {
  const byModel = memoStore.get(userId) ?? new Map<ModelId, MemoItem[]>();
  memoStore.set(userId, byModel);

  const list = byModel.get(modelId) ?? [];
  byModel.set(modelId, list);
  return list;
}

function ensureUserModelHistoryBucket(userId: UserId, modelId: ModelId): AiHistoryItem[] {
  const byModel = historyStore.get(userId) ?? new Map<ModelId, AiHistoryItem[]>();
  historyStore.set(userId, byModel);

  const list = byModel.get(modelId) ?? [];
  byModel.set(modelId, list);
  return list;
}

export function listMemos(userId: UserId, modelId: ModelId): MemoItem[] {
  return [...ensureUserModelMemoBucket(userId, modelId)];
}

export function createMemo(userId: UserId, modelId: ModelId, payload: Pick<MemoItem, "title" | "content">): MemoItem {
  const list = ensureUserModelMemoBucket(userId, modelId);
  const memo: MemoItem = {
    id: memoIdSeq++,
    title: payload.title,
    content: payload.content,
  };
  list.push(memo);
  return memo;
}

export function updateMemo(userId: UserId, memoId: number, payload: Pick<MemoItem, "title" | "content">): MemoItem | null {
  const byModel = memoStore.get(userId);
  if (!byModel) return null;

  for (const list of byModel.values()) {
    const idx = list.findIndex((item) => item.id === memoId);
    if (idx < 0) continue;
    const current = list[idx];
    if (!current) continue;

    const updated: MemoItem = { ...current, ...payload };
    list[idx] = updated;
    return updated;
  }

  return null;
}

export function deleteMemo(userId: UserId, memoId: number): boolean {
  const byModel = memoStore.get(userId);
  if (!byModel) return false;

  for (const [modelId, list] of byModel.entries()) {
    const next = list.filter((item) => item.id !== memoId);
    if (next.length === list.length) continue;

    byModel.set(modelId, next);
    return true;
  }

  return false;
}

export function listAiHistory(userId: UserId, modelId: ModelId): AiHistoryItem[] {
  return [...ensureUserModelHistoryBucket(userId, modelId)];
}

export function appendAiHistory(userId: UserId, modelId: ModelId, item: Omit<AiHistoryItem, "timestamp">): AiHistoryItem {
  const list = ensureUserModelHistoryBucket(userId, modelId);
  const full: AiHistoryItem = {
    ...item,
    timestamp: new Date().toISOString(),
  };
  list.push(full);
  return full;
}
