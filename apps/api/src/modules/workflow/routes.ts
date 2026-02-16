import type { FastifyInstance } from "fastify";
import {
  addFileToNode,
  createConnection,
  createNode,
  deleteConnection,
  deleteFile,
  deleteNode,
  findConnectionIdByPair,
  findFile,
  listWorkflow,
  updateNode,
} from "../../core/workflow-store";

interface NodePayload {
  title?: string;
  content?: string;
  x?: number;
  y?: number;
}

interface ConnectionPayload {
  from?: number;
  to?: number;
  fromAnchor?: string;
  toAnchor?: string;
}

export async function registerWorkflowRoutes(app: FastifyInstance) {
  app.get("/api/workflow", async (request) => {
    const userId = String(request.headers["x-user-id"] ?? "default-guest");
    const workflow = listWorkflow(userId);

    return {
      nodes: workflow.nodes.map((node) => ({
        id: node.id,
        title: node.title,
        content: node.content,
        x: node.x,
        y: node.y,
        files: node.files.map((file) => ({
          id: file.id,
          fileName: file.fileName,
          url: `/api/workflow/files/download/${file.id}`,
        })),
      })),
      connections: workflow.connections,
    };
  });

  app.post<{ Body: NodePayload }>("/api/workflow/nodes", async (request, reply) => {
    const userId = String(request.headers["x-user-id"] ?? "default-guest");
    const node = createNode(userId, {
      title: request.body?.title ?? "새 노드",
      content: request.body?.content ?? "",
      x: request.body?.x ?? 200,
      y: request.body?.y ?? 120,
    });

    return reply.code(201).send({ id: node.id });
  });

  app.put<{ Params: { id: string }; Body: NodePayload }>("/api/workflow/nodes/:id", async (request, reply) => {
    const nodeId = Number(request.params.id);
    if (!Number.isInteger(nodeId)) return reply.code(400).send({ message: "유효한 노드 ID가 아닙니다." });

    const userId = String(request.headers["x-user-id"] ?? "default-guest");
    const updated = updateNode(userId, nodeId, {
      title: request.body?.title,
      content: request.body?.content,
      x: request.body?.x,
      y: request.body?.y,
    });

    if (!updated) return reply.code(404).send({ message: "노드를 찾을 수 없습니다." });
    return { message: "ok" };
  });

  app.delete<{ Params: { id: string } }>("/api/workflow/nodes/:id", async (request, reply) => {
    const nodeId = Number(request.params.id);
    if (!Number.isInteger(nodeId)) return reply.code(400).send({ message: "유효한 노드 ID가 아닙니다." });

    const userId = String(request.headers["x-user-id"] ?? "default-guest");
    const deleted = deleteNode(userId, nodeId);
    if (!deleted) return reply.code(404).send({ message: "노드를 찾을 수 없습니다." });

    return reply.code(204).send();
  });

  app.post<{ Body: ConnectionPayload }>("/api/workflow/connections", async (request, reply) => {
    const from = Number(request.body?.from);
    const to = Number(request.body?.to);

    if (!Number.isInteger(from) || !Number.isInteger(to)) {
      return reply.code(400).send({ message: "유효한 연결 정보가 아닙니다." });
    }

    const userId = String(request.headers["x-user-id"] ?? "default-guest");
    const connection = createConnection(userId, {
      from,
      to,
      fromAnchor: request.body?.fromAnchor ?? "right",
      toAnchor: request.body?.toAnchor ?? "left",
    });

    if (!connection) return reply.code(400).send({ message: "연결을 만들 수 없습니다." });
    return reply.code(201).send(connection);
  });

  app.delete<{ Querystring: { id?: string; from?: string; to?: string } }>(
    "/api/workflow/connections",
    async (request, reply) => {
      const userId = String(request.headers["x-user-id"] ?? "default-guest");
      let id = Number(request.query.id);

      if (!Number.isInteger(id)) {
        const from = Number(request.query.from);
        const to = Number(request.query.to);
        if (!Number.isInteger(from) || !Number.isInteger(to)) {
          return reply.code(400).send({ message: "유효한 연결 정보가 아닙니다." });
        }

        const found = findConnectionIdByPair(userId, from, to);
        if (!found) return reply.code(404).send({ message: "연결을 찾을 수 없습니다." });
        id = found;
      }

      const deleted = deleteConnection(userId, id);
      if (!deleted) return reply.code(404).send({ message: "연결을 찾을 수 없습니다." });

      return reply.code(204).send();
    },
  );

  app.post<{ Params: { nodeId: string } }>("/api/workflow/nodes/:nodeId/files", async (request, reply) => {
    const nodeId = Number(request.params.nodeId);
    if (!Number.isInteger(nodeId)) return reply.code(400).send({ message: "유효한 노드 ID가 아닙니다." });

    const part = await request.file();
    if (!part) return reply.code(400).send({ message: "업로드할 파일이 없습니다." });

    const buffer = await part.toBuffer();
    const userId = String(request.headers["x-user-id"] ?? "default-guest");
    const file = addFileToNode(userId, nodeId, {
      fileName: part.filename,
      contentType: part.mimetype,
      buffer,
    });

    if (!file) return reply.code(404).send({ message: "노드를 찾을 수 없습니다." });
    return reply.code(201).send({ id: file.id, fileName: file.fileName, url: `/api/workflow/files/download/${file.id}` });
  });

  app.get<{ Params: { id: string } }>("/api/workflow/files/download/:id", async (request, reply) => {
    const id = Number(request.params.id);
    if (!Number.isInteger(id)) return reply.code(400).send({ message: "유효한 파일 ID가 아닙니다." });

    const userId = String(request.headers["x-user-id"] ?? "default-guest");
    const file = findFile(userId, id);
    if (!file) return reply.code(404).send({ message: "파일을 찾을 수 없습니다." });

    reply.header("Content-Type", file.contentType || "application/octet-stream");
    reply.header("Content-Disposition", `attachment; filename=\"${encodeURIComponent(file.fileName)}\"`);
    return file.buffer;
  });

  app.delete<{ Params: { id: string } }>("/api/workflow/files/:id", async (request, reply) => {
    const id = Number(request.params.id);
    if (!Number.isInteger(id)) return reply.code(400).send({ message: "유효한 파일 ID가 아닙니다." });

    const userId = String(request.headers["x-user-id"] ?? "default-guest");
    const deleted = deleteFile(userId, id);
    if (!deleted) return reply.code(404).send({ message: "파일을 찾을 수 없습니다." });

    return reply.code(204).send();
  });
}
