import type { WorkflowRepository, WorkflowFile } from "../../core/repository";
import { sanitizeFileName } from "../../domain/workflow/file.entity";

/**
 * WorkflowFileService — workflow node 의 첨부 파일 관련 use case.
 *
 * 책임:
 *   - 파일 업로드: sanitize → repository.addFileToNode
 *   - 파일 다운로드: repository.findFile (buffer 포함)
 *   - 파일 삭제: repository.deleteFile
 *
 * 비책임:
 *   - 파일 형식 검증 (확장자, 크기 등) — 현재는 없음, 향후 entity 에 추가될 자리
 *   - multipart 파싱 (controller 가 Fastify 의 request.file() 사용)
 *   - 응답 모양 결정 (controller 가 entity.buildFileResponse 호출)
 */
export class WorkflowFileService {
    constructor(private readonly repo: WorkflowRepository) {}

    /**
     * uploadFile — sanitize 한 파일명으로 node 에 첨부.
     *
     * @returns 첨부된 파일 메타데이터 + buffer. node 가 없거나 권한 없으면 null.
     */
    async uploadFile(input: {
        userId: string;
        nodeId: number;
        fileName: string;
        contentType: string;
        buffer: Buffer;
    }): Promise<WorkflowFile | null> {
        const sanitizedFileName = sanitizeFileName(input.fileName);

        return this.repo.addFileToNode(input.userId, input.nodeId, {
            fileName: sanitizedFileName,
            contentType: input.contentType,
            buffer: input.buffer,
        });
    }

    /**
     * downloadFile — file 의 메타데이터 + buffer 를 함께 반환.
     *
     * controller 가 reply 헤더에 contentType / fileName 을 세팅하고 buffer 를 직접 응답한다.
     * @returns 파일 객체 (buffer 포함). 없거나 권한 없으면 null.
     */
    async downloadFile(input: {
        userId: string;
        fileId: number;
    }): Promise<WorkflowFile | null> {
        return this.repo.findFile(input.userId, input.fileId);
    }

    /**
     * deleteFile — 소유자만 삭제 가능 (repository 가 userId 로 격리).
     *
     * @returns 삭제 성공 여부. 없거나 권한 없으면 false.
     */
    async deleteFile(input: {
        userId: string;
        fileId: number;
    }): Promise<boolean> {
        return this.repo.deleteFile(input.userId, input.fileId);
    }
}