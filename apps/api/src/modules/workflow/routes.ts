import type { FastifyInstance } from "fastify";
import { repositories } from "../../core/repository";

/**
 * legacy /api/workflow 라우트.
 *
 * 현재 남아있는 것: GET /api/workflow (전체 workflow 조회)
 *
 * 제거된 것 (v2 로 이전됨):
 *   - POST /api/workflow/nodes/:nodeId/files     → POST /api/v2/workflow/nodes/:nodeId/files
 *   - GET  /api/workflow/files/download/:id      → GET  /api/v2/workflow/files/:fileId
 *   - DELETE /api/workflow/files/:id             → DELETE /api/v2/workflow/files/:fileId
 *
 * 향후 backlog: GET /api/workflow 도 v2 로 이전 후 이 파일 제거.
 */
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
          // 클라이언트가 v2 다운로드 endpoint 를 사용하도록 URL 갱신.
          // 이전: /api/workflow/files/download/${file.id}
          url: `/api/v2/workflow/files/${file.id}`,
        })),
      })),
      connections: workflow.connections,
    };
  });
}