export interface Memo {
  readonly id: number;
  readonly userId: string;
  readonly modelId: number;
  readonly title: string;
  readonly content: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export function createMemo(input: {
  userId: string;
  modelId: number;
  title: string;
  content: string;
  id: number;
  now: string;
}): Memo {
  if (input.title.trim().length === 0) {
    throw new Error("memo title cannot be empty");
  }

  if (input.title.length > 200) {
    throw new Error("memo title too long");
  }

  if (input.content.length > 10000) {
    throw new Error("memo content too long");
  }

  return {
    id: input.id,
    userId: input.userId,
    modelId: input.modelId,
    title: input.title,
    content: input.content,
    createdAt: input.now,
    updatedAt: input.now,
  };
}

export function updateMemo(input: { existing: Memo; title?: string; content?: string; now: string }): Memo {
  if (input.title !== undefined && input.title.trim().length === 0) {
    throw new Error("memo title cannot be empty");
  }

  if (input.title !== undefined && input.title.length > 200) {
    throw new Error("memo title too long");
  }

  if (input.content !== undefined && input.content.length > 10000) {
    throw new Error("memo content too long");
  }

  return {
    id: input.existing.id,
    userId: input.existing.userId,
    modelId: input.existing.modelId,
    title: input.title ?? input.existing.title,
    content: input.content ?? input.existing.content,
    createdAt: input.existing.createdAt,
    updatedAt: input.now,
  };
}