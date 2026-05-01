import type { FastifyInstance } from "fastify";
import type { WorkflowFileController } from "./file.controller";

/**
 * Workflow File 라우트 schema.
 *
 * params 만 schema 적용 — body 가 multipart 라 ajv 영역 밖.
 * 향후 backlog: @fastify/multipart 옵션으로 파일 크기 제한 / MIME whitelist.
 */
const uploadFileParamsSchema = {
    type: "object",
    required: ["nodeId"],
    properties: {
        nodeId: { type: "string", pattern: "^[0-9]+$" },
    },
} as const;

const fileIdParamsSchema = {
    type: "object",
    required: ["fileId"],
    properties: {
        fileId: { type: "string", pattern: "^[0-9]+$" },
    },
} as const;

export async function registerWorkflowFileRoutesV2(
    app: FastifyInstance,
    controller: WorkflowFileController,
) {
    // POST /v2/workflow/nodes/:nodeId/files — multipart upload
    app.post<{ Params: { nodeId: string } }>(
        "/v2/workflow/nodes/:nodeId/files",
        {
            schema: { params: uploadFileParamsSchema },
        },
        (request, reply) => controller.uploadFile(request, reply),
    );

    // GET /v2/workflow/files/:fileId — binary download
    app.get<{ Params: { fileId: string } }>(
        "/v2/workflow/files/:fileId",
        {
            schema: { params: fileIdParamsSchema },
        },
        (request, reply) => controller.downloadFile(request, reply),
    );

    // DELETE /v2/workflow/files/:fileId
    app.delete<{ Params: { fileId: string } }>(
        "/v2/workflow/files/:fileId",
        {
            schema: { params: fileIdParamsSchema },
        },
        (request, reply) => controller.deleteFile(request, reply),
    );
}