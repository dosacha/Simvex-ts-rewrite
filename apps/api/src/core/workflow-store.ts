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

interface UserWorkflowState {
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
}

const workflowStore = new Map<string, UserWorkflowState>();
let nodeIdSeq = 1;
let connectionIdSeq = 1;
let fileIdSeq = 1;

function getState(userId: string): UserWorkflowState {
  const existing = workflowStore.get(userId);
  if (existing) return existing;

  const created: UserWorkflowState = { nodes: [], connections: [] };
  workflowStore.set(userId, created);
  return created;
}

export function listWorkflow(userId: string): UserWorkflowState {
  const state = getState(userId);
  return {
    nodes: state.nodes.map((node) => ({ ...node, files: [...node.files] })),
    connections: [...state.connections],
  };
}

export function createNode(userId: string, payload: Pick<WorkflowNode, "title" | "content" | "x" | "y">): WorkflowNode {
  const state = getState(userId);
  const node: WorkflowNode = {
    id: nodeIdSeq++,
    title: payload.title,
    content: payload.content,
    x: payload.x,
    y: payload.y,
    files: [],
  };
  state.nodes.push(node);
  return node;
}

export function updateNode(
  userId: string,
  nodeId: number,
  payload: Partial<Pick<WorkflowNode, "title" | "content" | "x" | "y">>,
): WorkflowNode | null {
  const state = getState(userId);
  const node = state.nodes.find((item) => item.id === nodeId);
  if (!node) return null;

  if (payload.title !== undefined) node.title = payload.title;
  if (payload.content !== undefined) node.content = payload.content;
  if (payload.x !== undefined) node.x = payload.x;
  if (payload.y !== undefined) node.y = payload.y;

  return node;
}

export function deleteNode(userId: string, nodeId: number): boolean {
  const state = getState(userId);
  const prevLength = state.nodes.length;
  state.nodes = state.nodes.filter((node) => node.id !== nodeId);
  if (state.nodes.length === prevLength) return false;

  state.connections = state.connections.filter((conn) => conn.from !== nodeId && conn.to !== nodeId);
  return true;
}

export function createConnection(userId: string, payload: Omit<WorkflowConnection, "id">): WorkflowConnection | null {
  const state = getState(userId);
  const fromExists = state.nodes.some((node) => node.id === payload.from);
  const toExists = state.nodes.some((node) => node.id === payload.to);
  if (!fromExists || !toExists || payload.from === payload.to) return null;

  const duplicate = state.connections.find(
    (conn) =>
      conn.from === payload.from &&
      conn.to === payload.to &&
      conn.fromAnchor === payload.fromAnchor &&
      conn.toAnchor === payload.toAnchor,
  );
  if (duplicate) return duplicate;

  const created: WorkflowConnection = {
    id: connectionIdSeq++,
    ...payload,
  };
  state.connections.push(created);
  return created;
}

export function deleteConnection(userId: string, connectionId: number): boolean {
  const state = getState(userId);
  const prevLength = state.connections.length;
  state.connections = state.connections.filter((conn) => conn.id !== connectionId);
  return state.connections.length !== prevLength;
}

export function findConnectionIdByPair(userId: string, from: number, to: number): number | null {
  const state = getState(userId);
  const found = state.connections.find((conn) => conn.from === from && conn.to === to);
  return found?.id ?? null;
}

export function addFileToNode(
  userId: string,
  nodeId: number,
  payload: Pick<WorkflowFile, "fileName" | "contentType" | "buffer">,
): WorkflowFile | null {
  const state = getState(userId);
  const node = state.nodes.find((item) => item.id === nodeId);
  if (!node) return null;

  const file: WorkflowFile = {
    id: fileIdSeq++,
    fileName: payload.fileName,
    contentType: payload.contentType,
    buffer: payload.buffer,
  };

  node.files.push(file);
  return file;
}

export function findFile(userId: string, fileId: number): WorkflowFile | null {
  const state = getState(userId);
  for (const node of state.nodes) {
    const file = node.files.find((item) => item.id === fileId);
    if (file) return file;
  }
  return null;
}

export function deleteFile(userId: string, fileId: number): boolean {
  const state = getState(userId);
  for (const node of state.nodes) {
    const prevLength = node.files.length;
    node.files = node.files.filter((item) => item.id !== fileId);
    if (node.files.length !== prevLength) return true;
  }
  return false;
}
