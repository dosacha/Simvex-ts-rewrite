import type { AiHistoryItem, MemoItem } from "@simvex/shared";

export interface MemoRepository {
  listByModel(userId: string, modelId: number): MemoItem[];
  create(userId: string, modelId: number, payload: Pick<MemoItem, "title" | "content">): MemoItem;
  update(userId: string, memoId: number, payload: Pick<MemoItem, "title" | "content">): MemoItem | null;
  delete(userId: string, memoId: number): boolean;
}

export interface AiHistoryRepository {
  listByModel(userId: string, modelId: number): AiHistoryItem[];
  append(userId: string, modelId: number, item: Omit<AiHistoryItem, "timestamp">): AiHistoryItem;
}

export interface WorkflowFile {
  id: number;
  fileName: string;
  contentType: string;
  buffer: Buffer;
}

export interface WorkflowNode {
  id: number;
  title: string;
  content: string;
  x: number;
  y: number;
  files: WorkflowFile[];
}

export interface WorkflowConnection {
  id: number;
  from: number;
  to: number;
  fromAnchor: string;
  toAnchor: string;
}

export interface WorkflowState {
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
}

export interface WorkflowRepository {
  list(userId: string): WorkflowState;
  createNode(userId: string, payload: Pick<WorkflowNode, "title" | "content" | "x" | "y">): WorkflowNode;
  updateNode(
    userId: string,
    nodeId: number,
    payload: Partial<Pick<WorkflowNode, "title" | "content" | "x" | "y">>,
  ): WorkflowNode | null;
  deleteNode(userId: string, nodeId: number): boolean;
  createConnection(userId: string, payload: Omit<WorkflowConnection, "id">): WorkflowConnection | null;
  deleteConnection(userId: string, connectionId: number): boolean;
  findConnectionIdByPair(userId: string, from: number, to: number): number | null;
  addFileToNode(userId: string, nodeId: number, payload: Pick<WorkflowFile, "fileName" | "contentType" | "buffer">): WorkflowFile | null;
  findFile(userId: string, fileId: number): WorkflowFile | null;
  deleteFile(userId: string, fileId: number): boolean;
}

class InMemoryMemoRepository implements MemoRepository {
  private memoStore = new Map<string, Map<number, MemoItem[]>>();
  private memoIdSeq = 1;

  private ensureBucket(userId: string, modelId: number): MemoItem[] {
    const byModel = this.memoStore.get(userId) ?? new Map<number, MemoItem[]>();
    this.memoStore.set(userId, byModel);

    const list = byModel.get(modelId) ?? [];
    byModel.set(modelId, list);
    return list;
  }

  listByModel(userId: string, modelId: number): MemoItem[] {
    return [...this.ensureBucket(userId, modelId)];
  }

  create(userId: string, modelId: number, payload: Pick<MemoItem, "title" | "content">): MemoItem {
    const list = this.ensureBucket(userId, modelId);
    const created: MemoItem = {
      id: this.memoIdSeq++,
      title: payload.title,
      content: payload.content,
    };
    list.push(created);
    return created;
  }

  update(userId: string, memoId: number, payload: Pick<MemoItem, "title" | "content">): MemoItem | null {
    const byModel = this.memoStore.get(userId);
    if (!byModel) return null;

    for (const list of byModel.values()) {
      const index = list.findIndex((item) => item.id === memoId);
      if (index < 0) continue;
      const current = list[index];
      if (!current) continue;

      const updated: MemoItem = { ...current, ...payload };
      list[index] = updated;
      return updated;
    }

    return null;
  }

  delete(userId: string, memoId: number): boolean {
    const byModel = this.memoStore.get(userId);
    if (!byModel) return false;

    for (const [modelId, list] of byModel.entries()) {
      const next = list.filter((item) => item.id !== memoId);
      if (next.length === list.length) continue;

      byModel.set(modelId, next);
      return true;
    }

    return false;
  }
}

class InMemoryAiHistoryRepository implements AiHistoryRepository {
  private historyStore = new Map<string, Map<number, AiHistoryItem[]>>();

  private ensureBucket(userId: string, modelId: number): AiHistoryItem[] {
    const byModel = this.historyStore.get(userId) ?? new Map<number, AiHistoryItem[]>();
    this.historyStore.set(userId, byModel);

    const list = byModel.get(modelId) ?? [];
    byModel.set(modelId, list);
    return list;
  }

  listByModel(userId: string, modelId: number): AiHistoryItem[] {
    return [...this.ensureBucket(userId, modelId)];
  }

  append(userId: string, modelId: number, item: Omit<AiHistoryItem, "timestamp">): AiHistoryItem {
    const list = this.ensureBucket(userId, modelId);
    const full: AiHistoryItem = {
      ...item,
      timestamp: new Date().toISOString(),
    };
    list.push(full);
    return full;
  }
}

class InMemoryWorkflowRepository implements WorkflowRepository {
  private workflowStore = new Map<string, WorkflowState>();
  private nodeIdSeq = 1;
  private connectionIdSeq = 1;
  private fileIdSeq = 1;

  private getState(userId: string): WorkflowState {
    const existing = this.workflowStore.get(userId);
    if (existing) return existing;

    const created: WorkflowState = { nodes: [], connections: [] };
    this.workflowStore.set(userId, created);
    return created;
  }

  list(userId: string): WorkflowState {
    const state = this.getState(userId);
    return {
      nodes: state.nodes.map((node) => ({ ...node, files: [...node.files] })),
      connections: [...state.connections],
    };
  }

  createNode(userId: string, payload: Pick<WorkflowNode, "title" | "content" | "x" | "y">): WorkflowNode {
    const state = this.getState(userId);
    const created: WorkflowNode = {
      id: this.nodeIdSeq++,
      title: payload.title,
      content: payload.content,
      x: payload.x,
      y: payload.y,
      files: [],
    };
    state.nodes.push(created);
    return created;
  }

  updateNode(
    userId: string,
    nodeId: number,
    payload: Partial<Pick<WorkflowNode, "title" | "content" | "x" | "y">>,
  ): WorkflowNode | null {
    const state = this.getState(userId);
    const node = state.nodes.find((item) => item.id === nodeId);
    if (!node) return null;

    if (payload.title !== undefined) node.title = payload.title;
    if (payload.content !== undefined) node.content = payload.content;
    if (payload.x !== undefined) node.x = payload.x;
    if (payload.y !== undefined) node.y = payload.y;

    return node;
  }

  deleteNode(userId: string, nodeId: number): boolean {
    const state = this.getState(userId);
    const prevLength = state.nodes.length;
    state.nodes = state.nodes.filter((node) => node.id !== nodeId);
    if (state.nodes.length === prevLength) return false;

    state.connections = state.connections.filter((connection) => connection.from !== nodeId && connection.to !== nodeId);
    return true;
  }

  createConnection(userId: string, payload: Omit<WorkflowConnection, "id">): WorkflowConnection | null {
    const state = this.getState(userId);
    const fromExists = state.nodes.some((node) => node.id === payload.from);
    const toExists = state.nodes.some((node) => node.id === payload.to);
    if (!fromExists || !toExists || payload.from === payload.to) return null;

    const duplicate = state.connections.find(
      (connection) =>
        connection.from === payload.from &&
        connection.to === payload.to &&
        connection.fromAnchor === payload.fromAnchor &&
        connection.toAnchor === payload.toAnchor,
    );
    if (duplicate) return duplicate;

    const created: WorkflowConnection = {
      id: this.connectionIdSeq++,
      ...payload,
    };
    state.connections.push(created);
    return created;
  }

  deleteConnection(userId: string, connectionId: number): boolean {
    const state = this.getState(userId);
    const prevLength = state.connections.length;
    state.connections = state.connections.filter((connection) => connection.id !== connectionId);
    return state.connections.length !== prevLength;
  }

  findConnectionIdByPair(userId: string, from: number, to: number): number | null {
    const state = this.getState(userId);
    const found = state.connections.find((connection) => connection.from === from && connection.to === to);
    return found?.id ?? null;
  }

  addFileToNode(
    userId: string,
    nodeId: number,
    payload: Pick<WorkflowFile, "fileName" | "contentType" | "buffer">,
  ): WorkflowFile | null {
    const state = this.getState(userId);
    const node = state.nodes.find((item) => item.id === nodeId);
    if (!node) return null;

    const file: WorkflowFile = {
      id: this.fileIdSeq++,
      fileName: payload.fileName,
      contentType: payload.contentType,
      buffer: payload.buffer,
    };
    node.files.push(file);
    return file;
  }

  findFile(userId: string, fileId: number): WorkflowFile | null {
    const state = this.getState(userId);
    for (const node of state.nodes) {
      const file = node.files.find((item) => item.id === fileId);
      if (file) return file;
    }
    return null;
  }

  deleteFile(userId: string, fileId: number): boolean {
    const state = this.getState(userId);
    for (const node of state.nodes) {
      const prevLength = node.files.length;
      node.files = node.files.filter((item) => item.id !== fileId);
      if (node.files.length !== prevLength) return true;
    }
    return false;
  }
}

export const repositories = {
  memo: new InMemoryMemoRepository(),
  aiHistory: new InMemoryAiHistoryRepository(),
  workflow: new InMemoryWorkflowRepository(),
};
