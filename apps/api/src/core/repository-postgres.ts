import { Pool, type QueryResultRow } from "pg";
import type { AiHistoryItem, MemoItem } from "@simvex/shared";
import { ensurePostgresSchema } from "./postgres-schema";
import type {
  AppRepositories,
  AiHistoryRepository,
  MemoRepository,
  WorkflowConnection,
  WorkflowFile,
  WorkflowNode,
  WorkflowRepository,
  WorkflowState,
} from "./repository";

interface PostgresOptions {
  databaseUrl?: string | null;
}

interface NodeRow {
  id: number;
  title: string;
  content: string;
  x: number;
  y: number;
}

interface ConnectionRow {
  id: number;
  from_node_id: number;
  to_node_id: number;
  from_anchor: string;
  to_anchor: string;
}

interface FileRow {
  id: number;
  node_id: number;
  file_name: string;
  content_type: string;
  data: Buffer;
}

class PostgresStore {
  private readonly pool: Pool;
  private initPromise: Promise<void> | null = null;

  constructor(databaseUrl: string) {
    this.pool = new Pool({ connectionString: databaseUrl, allowExitOnIdle: true });
  }

  private async ensureSchema(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      await ensurePostgresSchema(this.pool);
    })();

    return this.initPromise;
  }

  async query<T extends QueryResultRow>(sql: string, values: unknown[] = []): Promise<T[]> {
    await this.ensureSchema();
    const result = await this.pool.query<T>(sql, values);
    return result.rows;
  }
}

class PostgresMemoRepository implements MemoRepository {
  constructor(private readonly store: PostgresStore) {}

  async listByModel(userId: string, modelId: number): Promise<MemoItem[]> {
    const rows = await this.store.query<{ id: number; title: string; content: string }>(
      `SELECT id, title, content FROM memos WHERE user_id = $1 AND model_id = $2 ORDER BY id ASC`,
      [userId, modelId],
    );
    return rows.map((row) => ({ id: row.id, title: row.title, content: row.content }));
  }

  async create(userId: string, modelId: number, payload: Pick<MemoItem, "title" | "content">): Promise<MemoItem> {
    const rows = await this.store.query<{ id: number; title: string; content: string }>(
      `INSERT INTO memos (user_id, model_id, title, content)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, content`,
      [userId, modelId, payload.title, payload.content],
    );
    const created = rows[0];
    if (!created) throw new Error("memo insert failed");
    return created;
  }

  async update(userId: string, memoId: number, payload: Pick<MemoItem, "title" | "content">): Promise<MemoItem | null> {
    const rows = await this.store.query<{ id: number; title: string; content: string }>(
      `UPDATE memos
       SET title = $1, content = $2
       WHERE id = $3 AND user_id = $4
       RETURNING id, title, content`,
      [payload.title, payload.content, memoId, userId],
    );
    return rows[0] ?? null;
  }

  async delete(userId: string, memoId: number): Promise<boolean> {
    const rows = await this.store.query<{ id: number }>(`DELETE FROM memos WHERE id = $1 AND user_id = $2 RETURNING id`, [
      memoId,
      userId,
    ]);
    return rows.length > 0;
  }
}

class PostgresAiHistoryRepository implements AiHistoryRepository {
  constructor(private readonly store: PostgresStore) {}

  async listByModel(userId: string, modelId: number): Promise<AiHistoryItem[]> {
    const rows = await this.store.query<{ question: string; answer: string; created_at: string }>(
      `SELECT question, answer, created_at
       FROM ai_histories
       WHERE user_id = $1 AND model_id = $2
       ORDER BY id ASC`,
      [userId, modelId],
    );
    return rows.map((row) => ({
      question: row.question,
      answer: row.answer,
      timestamp: new Date(row.created_at).toISOString(),
    }));
  }

  async append(userId: string, modelId: number, item: Omit<AiHistoryItem, "timestamp">): Promise<AiHistoryItem> {
    const rows = await this.store.query<{ question: string; answer: string; created_at: string }>(
      `INSERT INTO ai_histories (user_id, model_id, question, answer)
       VALUES ($1, $2, $3, $4)
       RETURNING question, answer, created_at`,
      [userId, modelId, item.question, item.answer],
    );
    const created = rows[0];
    if (!created) throw new Error("ai history insert failed");
    return {
      question: created.question,
      answer: created.answer,
      timestamp: new Date(created.created_at).toISOString(),
    };
  }
}

class PostgresWorkflowRepository implements WorkflowRepository {
  constructor(private readonly store: PostgresStore) {}

  async list(userId: string): Promise<WorkflowState> {
    const [nodes, connections, files] = await Promise.all([
      this.store.query<NodeRow>(
        `SELECT id, title, content, x, y
         FROM workflow_nodes
         WHERE user_id = $1
         ORDER BY id ASC`,
        [userId],
      ),
      this.store.query<ConnectionRow>(
        `SELECT id, from_node_id, to_node_id, from_anchor, to_anchor
         FROM workflow_connections
         WHERE user_id = $1
         ORDER BY id ASC`,
        [userId],
      ),
      this.store.query<FileRow>(
        `SELECT id, node_id, file_name, content_type, data
         FROM workflow_files
         WHERE user_id = $1
         ORDER BY id ASC`,
        [userId],
      ),
    ]);

    const filesByNodeId = new Map<number, WorkflowFile[]>();
    for (const row of files) {
      const list = filesByNodeId.get(row.node_id) ?? [];
      list.push({
        id: row.id,
        fileName: row.file_name,
        contentType: row.content_type,
        buffer: Buffer.from(row.data),
      });
      filesByNodeId.set(row.node_id, list);
    }

    return {
      nodes: nodes.map((row) => ({
        id: row.id,
        title: row.title,
        content: row.content,
        x: row.x,
        y: row.y,
        files: filesByNodeId.get(row.id) ?? [],
      })),
      connections: connections.map((row) => ({
        id: row.id,
        from: row.from_node_id,
        to: row.to_node_id,
        fromAnchor: row.from_anchor,
        toAnchor: row.to_anchor,
      })),
    };
  }

  async createNode(userId: string, payload: Pick<WorkflowNode, "title" | "content" | "x" | "y">): Promise<WorkflowNode> {
    const rows = await this.store.query<NodeRow>(
      `INSERT INTO workflow_nodes (user_id, title, content, x, y)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, content, x, y`,
      [userId, payload.title, payload.content, payload.x, payload.y],
    );
    const created = rows[0];
    if (!created) throw new Error("workflow node insert failed");
    return { id: created.id, title: created.title, content: created.content, x: created.x, y: created.y, files: [] };
  }

  async updateNode(
    userId: string,
    nodeId: number,
    payload: Partial<Pick<WorkflowNode, "title" | "content" | "x" | "y">>,
  ): Promise<WorkflowNode | null> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (payload.title !== undefined) {
      fields.push(`title = $${values.length + 1}`);
      values.push(payload.title);
    }
    if (payload.content !== undefined) {
      fields.push(`content = $${values.length + 1}`);
      values.push(payload.content);
    }
    if (payload.x !== undefined) {
      fields.push(`x = $${values.length + 1}`);
      values.push(payload.x);
    }
    if (payload.y !== undefined) {
      fields.push(`y = $${values.length + 1}`);
      values.push(payload.y);
    }
    if (fields.length === 0) return null;

    values.push(nodeId, userId);
    const rows = await this.store.query<NodeRow>(
      `UPDATE workflow_nodes
       SET ${fields.join(", ")}
       WHERE id = $${values.length - 1} AND user_id = $${values.length}
       RETURNING id, title, content, x, y`,
      values,
    );

    const updated = rows[0];
    if (!updated) return null;
    return { id: updated.id, title: updated.title, content: updated.content, x: updated.x, y: updated.y, files: [] };
  }

  async deleteNode(userId: string, nodeId: number): Promise<boolean> {
    await this.store.query(`DELETE FROM workflow_files WHERE user_id = $1 AND node_id = $2`, [userId, nodeId]);
    await this.store.query(
      `DELETE FROM workflow_connections WHERE user_id = $1 AND (from_node_id = $2 OR to_node_id = $2)`,
      [userId, nodeId],
    );
    const rows = await this.store.query<{ id: number }>(
      `DELETE FROM workflow_nodes WHERE user_id = $1 AND id = $2 RETURNING id`,
      [userId, nodeId],
    );
    return rows.length > 0;
  }

  async createConnection(userId: string, payload: Omit<WorkflowConnection, "id">): Promise<WorkflowConnection | null> {
    if (payload.from === payload.to) return null;

    const nodeCheck = await this.store.query<{ id: number }>(
      `SELECT id FROM workflow_nodes WHERE user_id = $1 AND id IN ($2, $3)`,
      [userId, payload.from, payload.to],
    );
    if (nodeCheck.length < 2) return null;

    const duplicate = await this.store.query<ConnectionRow>(
      `SELECT id, from_node_id, to_node_id, from_anchor, to_anchor
       FROM workflow_connections
       WHERE user_id = $1
         AND from_node_id = $2
         AND to_node_id = $3
         AND from_anchor = $4
         AND to_anchor = $5
       LIMIT 1`,
      [userId, payload.from, payload.to, payload.fromAnchor, payload.toAnchor],
    );
    const dup = duplicate[0];
    if (dup) {
      return {
        id: dup.id,
        from: dup.from_node_id,
        to: dup.to_node_id,
        fromAnchor: dup.from_anchor,
        toAnchor: dup.to_anchor,
      };
    }

    const rows = await this.store.query<ConnectionRow>(
      `INSERT INTO workflow_connections (user_id, from_node_id, to_node_id, from_anchor, to_anchor)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, from_node_id, to_node_id, from_anchor, to_anchor`,
      [userId, payload.from, payload.to, payload.fromAnchor, payload.toAnchor],
    );
    const created = rows[0];
    if (!created) return null;
    return {
      id: created.id,
      from: created.from_node_id,
      to: created.to_node_id,
      fromAnchor: created.from_anchor,
      toAnchor: created.to_anchor,
    };
  }

  async deleteConnection(userId: string, connectionId: number): Promise<boolean> {
    const rows = await this.store.query<{ id: number }>(
      `DELETE FROM workflow_connections WHERE user_id = $1 AND id = $2 RETURNING id`,
      [userId, connectionId],
    );
    return rows.length > 0;
  }

  async findConnectionIdByPair(userId: string, from: number, to: number): Promise<number | null> {
    const rows = await this.store.query<{ id: number }>(
      `SELECT id FROM workflow_connections WHERE user_id = $1 AND from_node_id = $2 AND to_node_id = $3 ORDER BY id ASC LIMIT 1`,
      [userId, from, to],
    );
    return rows[0]?.id ?? null;
  }

  async addFileToNode(
    userId: string,
    nodeId: number,
    payload: Pick<WorkflowFile, "fileName" | "contentType" | "buffer">,
  ): Promise<WorkflowFile | null> {
    const nodeRows = await this.store.query<{ id: number }>(
      `SELECT id FROM workflow_nodes WHERE user_id = $1 AND id = $2 LIMIT 1`,
      [userId, nodeId],
    );
    if (!nodeRows[0]) return null;

    const rows = await this.store.query<FileRow>(
      `INSERT INTO workflow_files (user_id, node_id, file_name, content_type, data)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, node_id, file_name, content_type, data`,
      [userId, nodeId, payload.fileName, payload.contentType, payload.buffer],
    );
    const created = rows[0];
    if (!created) return null;
    return {
      id: created.id,
      fileName: created.file_name,
      contentType: created.content_type,
      buffer: Buffer.from(created.data),
    };
  }

  async findFile(userId: string, fileId: number): Promise<WorkflowFile | null> {
    const rows = await this.store.query<FileRow>(
      `SELECT id, node_id, file_name, content_type, data FROM workflow_files WHERE user_id = $1 AND id = $2 LIMIT 1`,
      [userId, fileId],
    );
    const found = rows[0];
    if (!found) return null;
    return {
      id: found.id,
      fileName: found.file_name,
      contentType: found.content_type,
      buffer: Buffer.from(found.data),
    };
  }

  async deleteFile(userId: string, fileId: number): Promise<boolean> {
    const rows = await this.store.query<{ id: number }>(
      `DELETE FROM workflow_files WHERE user_id = $1 AND id = $2 RETURNING id`,
      [userId, fileId],
    );
    return rows.length > 0;
  }
}

export function createPostgresRepositories(options?: PostgresOptions): AppRepositories {
  const databaseUrl = options?.databaseUrl ?? process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? "";
  if (!databaseUrl) {
    throw new Error("SIMVEX_REPOSITORY_DRIVER=postgres requires DATABASE_URL or POSTGRES_URL.");
  }

  const store = new PostgresStore(databaseUrl);
  return {
    memo: new PostgresMemoRepository(store),
    aiHistory: new PostgresAiHistoryRepository(store),
    workflow: new PostgresWorkflowRepository(store),
  };
}
