import fs from "node:fs";
import path from "node:path";
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

export interface AppRepositories {
  memo: MemoRepository;
  aiHistory: AiHistoryRepository;
  workflow: WorkflowRepository;
}

interface PersistedWorkflowFile {
  id: number;
  fileName: string;
  contentType: string;
  bufferBase64: string;
}

interface PersistedWorkflowNode {
  id: number;
  title: string;
  content: string;
  x: number;
  y: number;
  files: PersistedWorkflowFile[];
}

interface PersistedWorkflowState {
  nodes: PersistedWorkflowNode[];
  connections: WorkflowConnection[];
}

interface RepositoryDataState {
  memoIdSeq: number;
  nodeIdSeq: number;
  connectionIdSeq: number;
  fileIdSeq: number;
  memoStore: Record<string, Record<string, MemoItem[]>>;
  historyStore: Record<string, Record<string, AiHistoryItem[]>>;
  workflowStore: Record<string, WorkflowState>;
}

interface PersistedRepositoryDataState {
  memoIdSeq: number;
  nodeIdSeq: number;
  connectionIdSeq: number;
  fileIdSeq: number;
  memoStore: Record<string, Record<string, MemoItem[]>>;
  historyStore: Record<string, Record<string, AiHistoryItem[]>>;
  workflowStore: Record<string, PersistedWorkflowState>;
}

function createInitialState(): RepositoryDataState {
  return {
    memoIdSeq: 1,
    nodeIdSeq: 1,
    connectionIdSeq: 1,
    fileIdSeq: 1,
    memoStore: {},
    historyStore: {},
    workflowStore: {},
  };
}

function toRuntimeWorkflowState(state: PersistedWorkflowState): WorkflowState {
  return {
    nodes: state.nodes.map((node) => ({
      id: node.id,
      title: node.title,
      content: node.content,
      x: node.x,
      y: node.y,
      files: node.files.map((file) => ({
        id: file.id,
        fileName: file.fileName,
        contentType: file.contentType,
        buffer: Buffer.from(file.bufferBase64, "base64"),
      })),
    })),
    connections: state.connections.map((connection) => ({ ...connection })),
  };
}

function toPersistedWorkflowState(state: WorkflowState): PersistedWorkflowState {
  return {
    nodes: state.nodes.map((node) => ({
      id: node.id,
      title: node.title,
      content: node.content,
      x: node.x,
      y: node.y,
      files: node.files.map((file) => ({
        id: file.id,
        fileName: file.fileName,
        contentType: file.contentType,
        bufferBase64: file.buffer.toString("base64"),
      })),
    })),
    connections: state.connections.map((connection) => ({ ...connection })),
  };
}

class RepositoryDataStore {
  state: RepositoryDataState;

  constructor(private readonly filePath: string | null) {
    this.state = this.load();
  }

  private load(): RepositoryDataState {
    if (!this.filePath || !fs.existsSync(this.filePath)) return createInitialState();

    try {
      const raw = fs.readFileSync(this.filePath, "utf-8");
      const parsed = JSON.parse(raw) as Partial<PersistedRepositoryDataState>;
      const base = createInitialState();

      const workflowStore: Record<string, WorkflowState> = {};
      for (const [userId, state] of Object.entries(parsed.workflowStore ?? {})) {
        workflowStore[userId] = toRuntimeWorkflowState(state);
      }

      return {
        memoIdSeq: parsed.memoIdSeq ?? base.memoIdSeq,
        nodeIdSeq: parsed.nodeIdSeq ?? base.nodeIdSeq,
        connectionIdSeq: parsed.connectionIdSeq ?? base.connectionIdSeq,
        fileIdSeq: parsed.fileIdSeq ?? base.fileIdSeq,
        memoStore: parsed.memoStore ?? base.memoStore,
        historyStore: parsed.historyStore ?? base.historyStore,
        workflowStore,
      };
    } catch (error) {
      console.warn("repository state load failed. fallback to fresh state.", error);
      return createInitialState();
    }
  }

  save(): void {
    if (!this.filePath) return;

    const dir = path.dirname(this.filePath);
    fs.mkdirSync(dir, { recursive: true });

    const persisted: PersistedRepositoryDataState = {
      memoIdSeq: this.state.memoIdSeq,
      nodeIdSeq: this.state.nodeIdSeq,
      connectionIdSeq: this.state.connectionIdSeq,
      fileIdSeq: this.state.fileIdSeq,
      memoStore: this.state.memoStore,
      historyStore: this.state.historyStore,
      workflowStore: Object.fromEntries(
        Object.entries(this.state.workflowStore).map(([userId, workflow]) => [userId, toPersistedWorkflowState(workflow)]),
      ),
    };

    fs.writeFileSync(this.filePath, JSON.stringify(persisted, null, 2), "utf-8");
  }
}

class RepositoryMemo implements MemoRepository {
  constructor(private readonly store: RepositoryDataStore) {}

  private ensureBucket(userId: string, modelId: number): MemoItem[] {
    const byUser = this.store.state.memoStore[userId] ?? {};
    this.store.state.memoStore[userId] = byUser;

    const key = String(modelId);
    const list = byUser[key] ?? [];
    byUser[key] = list;
    return list;
  }

  listByModel(userId: string, modelId: number): MemoItem[] {
    return this.ensureBucket(userId, modelId).map((item) => ({ ...item }));
  }

  create(userId: string, modelId: number, payload: Pick<MemoItem, "title" | "content">): MemoItem {
    const list = this.ensureBucket(userId, modelId);
    const created: MemoItem = {
      id: this.store.state.memoIdSeq++,
      title: payload.title,
      content: payload.content,
    };
    list.push(created);
    this.store.save();
    return created;
  }

  update(userId: string, memoId: number, payload: Pick<MemoItem, "title" | "content">): MemoItem | null {
    const byUser = this.store.state.memoStore[userId];
    if (!byUser) return null;

    for (const modelKey of Object.keys(byUser)) {
      const list = byUser[modelKey];
      if (!list) continue;

      const index = list.findIndex((item) => item.id === memoId);
      if (index < 0) continue;

      const current = list[index];
      if (!current) continue;

      const updated: MemoItem = { ...current, ...payload };
      list[index] = updated;
      this.store.save();
      return updated;
    }

    return null;
  }

  delete(userId: string, memoId: number): boolean {
    const byUser = this.store.state.memoStore[userId];
    if (!byUser) return false;

    for (const modelKey of Object.keys(byUser)) {
      const list = byUser[modelKey];
      if (!list) continue;

      const next = list.filter((item) => item.id !== memoId);
      if (next.length === list.length) continue;

      byUser[modelKey] = next;
      this.store.save();
      return true;
    }

    return false;
  }
}

class RepositoryAiHistory implements AiHistoryRepository {
  constructor(private readonly store: RepositoryDataStore) {}

  private ensureBucket(userId: string, modelId: number): AiHistoryItem[] {
    const byUser = this.store.state.historyStore[userId] ?? {};
    this.store.state.historyStore[userId] = byUser;

    const key = String(modelId);
    const list = byUser[key] ?? [];
    byUser[key] = list;
    return list;
  }

  listByModel(userId: string, modelId: number): AiHistoryItem[] {
    return this.ensureBucket(userId, modelId).map((item) => ({ ...item }));
  }

  append(userId: string, modelId: number, item: Omit<AiHistoryItem, "timestamp">): AiHistoryItem {
    const list = this.ensureBucket(userId, modelId);
    const created: AiHistoryItem = {
      ...item,
      timestamp: new Date().toISOString(),
    };
    list.push(created);
    this.store.save();
    return created;
  }
}

class RepositoryWorkflow implements WorkflowRepository {
  constructor(private readonly store: RepositoryDataStore) {}

  private ensureState(userId: string): WorkflowState {
    const existing = this.store.state.workflowStore[userId];
    if (existing) return existing;

    const created: WorkflowState = { nodes: [], connections: [] };
    this.store.state.workflowStore[userId] = created;
    return created;
  }

  list(userId: string): WorkflowState {
    const state = this.ensureState(userId);
    return {
      nodes: state.nodes.map((node) => ({
        ...node,
        files: node.files.map((file) => ({ ...file, buffer: Buffer.from(file.buffer) })),
      })),
      connections: state.connections.map((connection) => ({ ...connection })),
    };
  }

  createNode(userId: string, payload: Pick<WorkflowNode, "title" | "content" | "x" | "y">): WorkflowNode {
    const state = this.ensureState(userId);
    const created: WorkflowNode = {
      id: this.store.state.nodeIdSeq++,
      title: payload.title,
      content: payload.content,
      x: payload.x,
      y: payload.y,
      files: [],
    };
    state.nodes.push(created);
    this.store.save();
    return created;
  }

  updateNode(
    userId: string,
    nodeId: number,
    payload: Partial<Pick<WorkflowNode, "title" | "content" | "x" | "y">>,
  ): WorkflowNode | null {
    const state = this.ensureState(userId);
    const node = state.nodes.find((item) => item.id === nodeId);
    if (!node) return null;

    if (payload.title !== undefined) node.title = payload.title;
    if (payload.content !== undefined) node.content = payload.content;
    if (payload.x !== undefined) node.x = payload.x;
    if (payload.y !== undefined) node.y = payload.y;

    this.store.save();
    return node;
  }

  deleteNode(userId: string, nodeId: number): boolean {
    const state = this.ensureState(userId);
    const prevLength = state.nodes.length;
    state.nodes = state.nodes.filter((node) => node.id !== nodeId);
    if (state.nodes.length === prevLength) return false;

    state.connections = state.connections.filter((connection) => connection.from !== nodeId && connection.to !== nodeId);
    this.store.save();
    return true;
  }

  createConnection(userId: string, payload: Omit<WorkflowConnection, "id">): WorkflowConnection | null {
    const state = this.ensureState(userId);
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
      id: this.store.state.connectionIdSeq++,
      ...payload,
    };
    state.connections.push(created);
    this.store.save();
    return created;
  }

  deleteConnection(userId: string, connectionId: number): boolean {
    const state = this.ensureState(userId);
    const prevLength = state.connections.length;
    state.connections = state.connections.filter((connection) => connection.id !== connectionId);
    if (state.connections.length === prevLength) return false;

    this.store.save();
    return true;
  }

  findConnectionIdByPair(userId: string, from: number, to: number): number | null {
    const state = this.ensureState(userId);
    const found = state.connections.find((connection) => connection.from === from && connection.to === to);
    return found?.id ?? null;
  }

  addFileToNode(
    userId: string,
    nodeId: number,
    payload: Pick<WorkflowFile, "fileName" | "contentType" | "buffer">,
  ): WorkflowFile | null {
    const state = this.ensureState(userId);
    const node = state.nodes.find((item) => item.id === nodeId);
    if (!node) return null;

    const file: WorkflowFile = {
      id: this.store.state.fileIdSeq++,
      fileName: payload.fileName,
      contentType: payload.contentType,
      buffer: Buffer.from(payload.buffer),
    };
    node.files.push(file);
    this.store.save();
    return file;
  }

  findFile(userId: string, fileId: number): WorkflowFile | null {
    const state = this.ensureState(userId);
    for (const node of state.nodes) {
      const found = node.files.find((file) => file.id === fileId);
      if (found) return found;
    }
    return null;
  }

  deleteFile(userId: string, fileId: number): boolean {
    const state = this.ensureState(userId);
    for (const node of state.nodes) {
      const prevLength = node.files.length;
      node.files = node.files.filter((file) => file.id !== fileId);
      if (node.files.length === prevLength) continue;

      this.store.save();
      return true;
    }
    return false;
  }
}

function createRepositoryDataStore(filePath: string | null): RepositoryDataStore {
  return new RepositoryDataStore(filePath);
}

export function createRepositories(options?: { filePath?: string | null }): AppRepositories {
  const envFilePath = process.env.SIMVEX_REPOSITORY_FILE?.trim();
  const resolvedFilePath =
    options?.filePath !== undefined
      ? options.filePath
      : (envFilePath ? path.resolve(envFilePath) : null);

  const dataStore = createRepositoryDataStore(resolvedFilePath ?? null);
  return {
    memo: new RepositoryMemo(dataStore),
    aiHistory: new RepositoryAiHistory(dataStore),
    workflow: new RepositoryWorkflow(dataStore),
  };
}

export const repositories = createRepositories();
