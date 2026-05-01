import type { FastifyRequest, FastifyReply } from "fastify";
import type { WorkflowFileService } from "../../../../application/workflow/file.service";
import { buildFileResponse } from "../../../../domain/workflow/file.entity";

/**
 * WorkflowFileController — workflow node 의 첨부 파일 라우트 핸들러.
 *
 * 책임 분리:
 *   - schema = params 의 숫자 패턴 검증 (controller 진입 전)
 *   - controller = multipart 파싱 (schema 영역 밖) + service 호출 + reply 모양
 *   - service = sanitize → repository
 *   - entity = sanitize 규칙 + 응답 객체 생성 (buffer 노출 차단)
 */
export class WorkflowFileController {
    constructor(private readonly service: WorkflowFileService) {}

    /**
     * POST /v2/workflow/nodes/:nodeId/files
     * multipart/form-data 로 단일 파일 업로드.
     *
     * schema 가 nodeId 형식 보장. body 의 file part 존재 여부는 controller 가 검증
     * (multipart 는 JSON schema 영역 밖).
     */
    async uploadFile(
        request: FastifyRequest<{ Params: { nodeId: string } }>,
        reply: FastifyReply,
    ) {
        const nodeId = Number(request.params.nodeId);
        const userId = request.userId;

        const part = await request.file();
        if (!part) {
            return reply.code(400).send({ message: "업로드할 파일이 없습니다." });
        }

        const buffer = await part.toBuffer();

        const file = await this.service.uploadFile({
            userId,
            nodeId,
            fileName: part.filename,
            contentType: part.mimetype,
            buffer,
        });

        if (!file) {
            return reply.code(404).send({ message: "노드를 찾을 수 없습니다." });
        }

        return reply.code(201).send(buildFileResponse(file));
    }

    /**
     * GET /v2/workflow/files/:fileId
     * 파일 binary 다운로드.
     *
     * 응답이 JSON 이 아니라 binary Buffer — Fastify 가 Buffer 를 자동 binary 응답으로 처리.
     * Content-Type 과 Content-Disposition 헤더는 controller 가 직접 세팅.
     */
    async downloadFile(
        request: FastifyRequest<{ Params: { fileId: string } }>,
        reply: FastifyReply,
    ) {
        const fileId = Number(request.params.fileId);
        const userId = request.userId;

        const file = await this.service.downloadFile({ userId, fileId });
        if (!file) {
            return reply.code(404).send({ message: "파일을 찾을 수 없습니다." });
        }

        reply.header("Content-Type", file.contentType || "application/octet-stream");
        reply.header(
            "Content-Disposition",
            `attachment; filename="${encodeURIComponent(file.fileName)}"`,
        );
        return file.buffer;
    }

    /**
     * DELETE /v2/workflow/files/:fileId
     * 파일 삭제. 소유자만 가능 (repository 의 userId 격리로 자연스럽게 보장).
     */
    async deleteFile(
        request: FastifyRequest<{ Params: { fileId: string } }>,
        reply: FastifyReply,
    ) {
        const fileId = Number(request.params.fileId);
        const userId = request.userId;

        const deleted = await this.service.deleteFile({ userId, fileId });
        if (!deleted) {
            return reply.code(404).send({ message: "파일을 찾을 수 없습니다." });
        }
        return reply.code(204).send();
    }
}