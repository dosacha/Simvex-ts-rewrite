import type { WorkflowFile } from "../../core/repository";
import { WORKFLOW_FILE_DOWNLOAD_PATH } from "./workflow.entity";

export type { WorkflowFile } from "../../core/repository";

/**
 * sanitizeFileName — 업로드된 파일명을 안전한 형태로 정규화.
 *
 * 도메인 규칙:
 *   - 제어 문자 (\u0000 ~ \u001f, \u007f) 제거 — 파일 시스템 / DB 안전성
 *   - 경로 구분자 (\, /) 를 _ 로 치환 — directory traversal 방어
 *   - 빈 결과 fallback ("uploaded-file") — 빈 파일명 거부
 *
 * 책임 분리:
 *   - schema = 형식 (multipart 파싱은 Fastify 가)
 *   - entity = 도메인 규칙 (이 sanitize 가 도메인 규칙)
 */
export function sanitizeFileName(fileName: string): string {
    // 의도된 제어 문자 매칭 (보안: directory traversal / null byte 방어)
    // eslint-disable-next-line no-control-regex
    const normalized = fileName.replace(/[\u0000-\u001f\u007f]+/g, "").trim();
    const noPath = normalized.replace(/[\\/]+/g, "_");
    return noPath.length > 0 ? noPath : "uploaded-file";
}

/**
 * buildFileResponse — 클라이언트 응답용 파일 메타데이터 변환.
 *
 * 책임: id + fileName + 다운로드 URL 만 노출 (buffer 절대 노출 안 함)
 *
 * 비책임: contentType 노출 — download endpoint 에서 직접 응답 헤더로 설정.
 *
 * 보안: 응답에 buffer 가 새어 나가는 사고를 entity 차원에서 방지.
 */
export function buildFileResponse(file: WorkflowFile): {
    id: number;
    fileName: string;
    url: string;
} {
    return {
        id: file.id,
        fileName: file.fileName,
        url: `${WORKFLOW_FILE_DOWNLOAD_PATH}/${file.id}`,
    };
}