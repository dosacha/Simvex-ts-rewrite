import fs from "node:fs";
import path from "node:path";
import type { AiHistoryItem, MemoItem } from "@simvex/shared";
import { createPostgresRepositories } from "./repository-postgres";

export interface MemoRepository {
  listByModel(userId: string, modelId: number): Promise<MemoItem[]>;
  create(userId: string, modelId: number, payload: Pick<MemoItem, "title" | "content">): Promise<MemoItem>;
  update(userId: string, memoId: number, payload: Pick<MemoItem, "title" | "content">): Promise<MemoItem | null>;
  delete(userId: string, memoId: number): Promise<boolean>;
}

export interface AiHistoryRepository {
  listByModel(userId: string, modelId: number): Promise<AiHistoryItem[]>;
  append(userId: string, modelId: number, item: Omit<AiHistoryItem, "timestamp">): Promise<AiHistoryItem>;
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
  list(userId: string): Promise<WorkflowState>;
  createNode(userId: string, payload: Pick<WorkflowNode, "title" | "content" | "x" | "y">): Promise<WorkflowNode>;
  updateNode(
    userId: string,
    nodeId: number,
    payload: Partial<Pick<WorkflowNode, "title" | "content" | "x" | "y">>,
  ): Promise<WorkflowNode | null>;
  deleteNode(userId: string, nodeId: number): Promise<boolean>;
  createConnection(userId: string, payload: Omit<WorkflowConnection, "id">): Promise<WorkflowConnection | null>;
  deleteConnection(userId: string, connectionId: number): Promise<boolean>;
  findConnectionIdByPair(userId: string, from: number, to: number): Promise<number | null>;
  addFileToNode(
    userId: string,
    nodeId: number,
    payload: Pick<WorkflowFile, "fileName" | "contentType" | "buffer">,
  ): Promise<WorkflowFile | null>;
  findFile(userId: string, fileId: number): Promise<WorkflowFile | null>;
  deleteFile(userId: string, fileId: number): Promise<boolean>;
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

type RepositoryDriver = "memory" | "file" | "postgres";

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

class InMemoryMemoRepository implements MemoRepository {
  constructor(private readonly store: RepositoryDataStore) {}

  private ensureBucket(userId: string, modelId: number): MemoItem[] {
    const byUser = this.store.state.memoStore[userId] ?? {};
    this.store.state.memoStore[userId] = byUser;

    const key = String(modelId);
    const list = byUser[key] ?? [];
    byUser[key] = list;
    return list;
  }

  async listByModel(userId: string, modelId: number): Promise<MemoItem[]> {
    return this.ensureBucket(userId, modelId).map((item) => ({ ...item }));
  }

  async create(userId: string, modelId: number, payload: Pick<MemoItem, "title" | "content">): Promise<MemoItem> {
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

  async update(userId: string, memoId: number, payload: Pick<MemoItem, "title" | "content">): Promise<MemoItem | null> {
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

  async delete(userId: string, memoId: number): Promise<boolean> {
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

class InMemoryAiHistoryRepository implements AiHistoryRepository {
  constructor(private readonly store: RepositoryDataStore) {}

  private ensureBucket(userId: string, modelId: number): AiHistoryItem[] {
    const byUser = this.store.state.historyStore[userId] ?? {};
    this.store.state.historyStore[userId] = byUser;

    const key = String(modelId);
    const list = byUser[key] ?? [];
    byUser[key] = list;
    return list;
  }

  async listByModel(userId: string, modelId: number): Promise<AiHistoryItem[]> {
    return this.ensureBucket(userId, modelId).map((item) => ({ ...item }));
  }

  async append(userId: string, modelId: number, item: Omit<AiHistoryItem, "timestamp">): Promise<AiHistoryItem> {
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

class InMemoryWorkflowRepository implements WorkflowRepository {
  constructor(private readonly store: RepositoryDataStore) {}

  private ensureState(userId: string): WorkflowState {
    const existing = this.store.state.workflowStore[userId];
    if (existing) return existing;

    const created: WorkflowState = { nodes: [], connections: [] };
    this.store.state.workflowStore[userId] = created;
    return created;
  }

  async list(userId: string): Promise<WorkflowState> {
    const state = this.ensureState(userId);
    return {
      nodes: state.nodes.map((node) => ({
        ...node,
        files: node.files.map((file) => ({ ...file, buffer: Buffer.from(file.buffer) })),
      })),
      connections: state.connections.map((connection) => ({ ...connection })),
    };
  }

  async createNode(userId: string, payload: Pick<WorkflowNode, "title" | "content" | "x" | "y">): Promise<WorkflowNode> {
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

  async updateNode(
    userId: string,
    nodeId: number,
    payload: Partial<Pick<WorkflowNode, "title" | "content" | "x" | "y">>,
  ): Promise<WorkflowNode | null> {
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

  async deleteNode(userId: string, nodeId: number): Promise<boolean> {
    const state = this.ensureState(userId);
    const prevLength = state.nodes.length;
    state.nodes = state.nodes.filter((node) => node.id !== nodeId);
    if (state.nodes.length === prevLength) return false;

    state.connections = state.connections.filter((connection) => connection.from !== nodeId && connection.to !== nodeId);
    this.store.save();
    return true;
  }

  async createConnection(userId: string, payload: Omit<WorkflowConnection, "id">): Promise<WorkflowConnection | null> {
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

  async deleteConnection(userId: string, connectionId: number): Promise<boolean> {
    const state = this.ensureState(userId);
    const prevLength = state.connections.length;
    state.connections = state.connections.filter((connection) => connection.id !== connectionId);
    if (state.connections.length === prevLength) return false;

    this.store.save();
    return true;
  }

  async findConnectionIdByPair(userId: string, from: number, to: number): Promise<number | null> {
    const state = this.ensureState(userId);
    const found = state.connections.find((connection) => connection.from === from && connection.to === to);
    return found?.id ?? null;
  }

  async addFileToNode(
    userId: string,
    nodeId: number,
    payload: Pick<WorkflowFile, "fileName" | "contentType" | "buffer">,
  ): Promise<WorkflowFile | null> {
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

  async findFile(userId: string, fileId: number): Promise<WorkflowFile | null> {
    const state = this.ensureState(userId);
    for (const node of state.nodes) {
      const found = node.files.find((file) => file.id === fileId);
      if (found) return found;
    }
    return null;
  }

  async deleteFile(userId: string, fileId: number): Promise<boolean> {
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

function createInMemoryRepositories(filePath: string | null): AppRepositories {
  const dataStore = createRepositoryDataStore(filePath);
  return {
    memo: new InMemoryMemoRepository(dataStore),
    aiHistory: new InMemoryAiHistoryRepository(dataStore),
    workflow: new InMemoryWorkflowRepository(dataStore),
  };
}

function resolveDriver(options?: { driver?: RepositoryDriver }): RepositoryDriver {
  if (options?.driver) return options.driver;

  const envDriver = process.env.SIMVEX_REPOSITORY_DRIVER?.trim().toLowerCase();
  if (envDriver === "postgres") return "postgres";
  if (envDriver === "file") return "file";
  return "memory";
}

function resolveFilePath(options?: { filePath?: string | null }): string | null {
  if (options?.filePath !== undefined) return options.filePath;

  const envFilePath = process.env.SIMVEX_REPOSITORY_FILE?.trim();
  return envFilePath ? path.resolve(envFilePath) : null;
}

export function createRepositories(options?: {
  driver?: RepositoryDriver;
  filePath?: string | null;
  databaseUrl?: string | null;
}): AppRepositories {
  const driver = resolveDriver(options);
  if (driver === "postgres") {
    return createPostgresRepositories({ databaseUrl: options?.databaseUrl ?? process.env.DATABASE_URL ?? null });
  }

  const filePath = driver === "file" ? resolveFilePath(options) : null;
  return createInMemoryRepositories(filePath);
}

export const repositories = createRepositories();
