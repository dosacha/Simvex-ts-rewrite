import { WorkflowNode, WorkflowConnection, WorkflowFile, WorkflowState } from "../../core/repository";
export type { WorkflowNode, WorkflowConnection } from "../../core/repository";

/**
 * createNode — 노드 생성 entity.
 *
 * 책임: 신뢰된 입력으로 payload 구성.
 * 비책임: 형식 검증 (title 빈문자/길이) — schema 가 처리.
 */
export function createNode(input: {
    title: string;
    content: string;
    x: number;
    y: number;
}): Pick<WorkflowNode, "title" | "content" | "x" | "y"> {
    return {
        title: input.title,
        content: input.content,
        x: input.x,
        y: input.y,
    };
}

/**
 * updateNode — 노드 수정 entity.
 *
 * 책임: undefined 가 아닌 필드만 골라 payload 구성.
 * 비책임: 형식 검증 (minProperties / 길이) — schema 가 처리.
 */
export function updateNode(input: {
    title?: string;
    content?: string;
    x?: number;
    y?: number;
}): Partial<Pick<WorkflowNode, "title" | "content" | "x" | "y">> {
    const payload: Partial<Pick<WorkflowNode, "title" | "content" | "x" | "y">> = {};
    if (input.title !== undefined) payload.title = input.title;
    if (input.content !== undefined) payload.content = input.content;
    if (input.x !== undefined) payload.x = input.x;
    if (input.y !== undefined) payload.y = input.y;
    return payload;
}

/**
 * createConnection — 연결 생성 entity.
 *
 * 책임: 도메인 규칙 검증.
 *   - 자기 자신과의 연결 금지 (from === to) ← schema 로 표현 어렵고 도메인 의미가 강함.
 *
 * 비책임: 형식 검증 (필수 필드 / 타입 / 길이) — schema 가 처리.
 */
export function createConnection(input: {
    from: number;
    to: number;
    fromAnchor: string;
    toAnchor: string;
}): Omit<WorkflowConnection, "id"> {
    if (input.from === input.to) {
        throw new Error("자기 자신과 연결할 수 없습니다");
    }
    return {
        from: input.from,
        to: input.to,
        fromAnchor: input.fromAnchor,
        toAnchor: input.toAnchor,
    };
}

// ────────────────────────────────────────────────
// 응답 변환 (HTTP DTO)
// ────────────────────────────────────────────────

/**
 * file URL 정규화 base path.
 *
 * 현재: 상수로 분리. 환경 변수 / CDN base URL 분리는 backlog.
 *      backlog 작업 시 이 상수만 config 에서 받도록 변경하면 됨.
 *
 * file.entity.ts 의 buildFileResponse 의 URL 과 정확히 같은 형식이라
 * 두 곳에서 같은 상수 사용 (export). 변경 시 한 곳만 수정하면 됨.
 */
export const WORKFLOW_FILE_DOWNLOAD_PATH = "/api/v2/workflow/files";

export interface FileUrlReference {
    id: number;
    fileName: string;
    url: string;
}

export interface NodeResponse {
    id: number;
    title: string;
    content: string;
    x: number;
    y: number;
    files: FileUrlReference[];
}

export interface WorkflowResponse {
    nodes: NodeResponse[];
    connections: WorkflowConnection[];
}

/**
 * Workflow 도메인 객체 → HTTP 응답 DTO 변환.
 *
 * 책임:
 *   - file URL 을 v2 download endpoint 로 정규화 (/api/v2/workflow/files/:id)
 *   - file 의 buffer / contentType 같은 내부 필드는 응답에서 제외
 *   - connection 은 도메인 모양 그대로 유출 (현재 단계에선 충분)
 *
 * file.entity 의 buildFileResponse 와 같은 패턴 — entity 가 응답 모양 책임.
 */
export function buildWorkflowResponse(workflow: WorkflowState): WorkflowResponse {
    return {
        nodes: workflow.nodes.map(buildNodeResponse),
        connections: workflow.connections,
    };
}

function buildNodeResponse(node: WorkflowNode): NodeResponse {
    return {
        id: node.id,
        title: node.title,
        content: node.content,
        x: node.x,
        y: node.y,
        files: node.files.map(buildFileUrlReference),
    };
}

function buildFileUrlReference(file: WorkflowFile): FileUrlReference {
    return {
        id: file.id,
        fileName: file.fileName,
        url: `${WORKFLOW_FILE_DOWNLOAD_PATH}/${file.id}`,
    };
}