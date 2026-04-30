import type { FastifyInstance } from "fastify";
import { repositories } from "../../core/repository";

function sanitizeFileName(fileName: string): string {
  const normalized = fileName.replace(/[\u0000-\u001f\u007f]+/g, "").trim();
  const noPath = normalized.replace(/[\\/]+/g, "_");
  return noPath.length > 0 ? noPath : "uploaded-file";
}

export async function registerWorkflowRoutes(app: FastifyInstance) {
  app.get("/workflow", async (request) => {
    const userId = String(request.headers["x-user-id"] ?? "default-guest");
    const workflow = await repositories.workflow.list(userId);

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

  app.post<{ Params: { nodeId: string } }>("/workflow/nodes/:nodeId/files", async (request, reply) => {
    const nodeId = Number(request.params.nodeId);
    if (!Number.isInteger(nodeId)) return reply.code(400).send({ message: "유효한 노드 ID가 아닙니다." });

    const part = await request.file();
    if (!part) return reply.code(400).send({ message: "업로드할 파일이 없습니다." });

    const buffer = await part.toBuffer();
    const fileName = sanitizeFileName(part.filename);
    const userId = String(request.headers["x-user-id"] ?? "default-guest");
    const file = await repositories.workflow.addFileToNode(userId, nodeId, {
      fileName,
      contentType: part.mimetype,
      buffer,
    });

    if (!file) return reply.code(404).send({ message: "노드를 찾을 수 없습니다." });
    return reply.code(201).send({ id: file.id, fileName: file.fileName, url: `/api/workflow/files/download/${file.id}` });
  });

  app.get<{ Params: { id: string } }>("/workflow/files/download/:id", async (request, reply) => {
    const id = Number(request.params.id);
    if (!Number.isInteger(id)) return reply.code(400).send({ message: "유효한 파일 ID가 아닙니다." });

    const userId = String(request.headers["x-user-id"] ?? "default-guest");
    const file = await repositories.workflow.findFile(userId, id);
    if (!file) return reply.code(404).send({ message: "파일을 찾을 수 없습니다." });

    reply.header("Content-Type", file.contentType || "application/octet-stream");
    reply.header("Content-Disposition", `attachment; filename=\"${encodeURIComponent(file.fileName)}\"`);
    return file.buffer;
  });

  app.delete<{ Params: { id: string } }>("/workflow/files/:id", async (request, reply) => {
    const id = Number(request.params.id);
    if (!Number.isInteger(id)) return reply.code(400).send({ message: "유효한 파일 ID가 아닙니다." });

    const userId = String(request.headers["x-user-id"] ?? "default-guest");
    const deleted = await repositories.workflow.deleteFile(userId, id);
    if (!deleted) return reply.code(404).send({ message: "파일을 찾을 수 없습니다." });

    return reply.code(204).send();
  });
}
