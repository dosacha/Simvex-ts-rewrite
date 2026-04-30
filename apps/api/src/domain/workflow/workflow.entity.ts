import { WorkflowNode, WorkflowConnection } from "../../core/repository";

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