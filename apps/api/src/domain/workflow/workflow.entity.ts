import {WorkflowNode, WorkflowConnection, WorkflowFile, WorkflowState} from "../../core/repository"
export type { WorkflowNode, WorkflowConnection } from "../../core/repository";

export function createNode(input: {title: string; content: string; x: number; y: number}): Pick<WorkflowNode, "title" | "content" | "x" | "y"> {
    if(input.title.trim().length === 0) {
        throw new Error("workflow title cannot be empty");
    }

    if(input.title.length > 200) {
        throw new Error("workflow title too long");
    }

    if(input.content.length > 10000) {
        throw new Error("Workflow content too long");
    }

    return {
        title: input.title,
        content: input.content,
        x: input.x,
        y: input.y
    };
}

export function updateNode(input: {
    title?: string;
    content?: string;
    x?: number;
    y?: number;
}): Partial<Pick<WorkflowNode, "title" | "content" | "x" | "y">> {
    if(input.title !== undefined && input.title.trim().length === 0) {
        throw new Error("workflow title cannot be empty");
    }

    if(input.title !== undefined && input.title.length > 200) {
        throw new Error("workflow title too long");
    }

    if(input.content !== undefined && input.content.length > 10000) {
        throw new Error("Workflow content too long");
    }

    if(input.content === undefined && input.title === undefined && input.x === undefined && input.y === undefined) {
        throw new Error("everything is undefined");
    }

    const payload: Partial<Pick<WorkflowNode, "title" | "content" | "x" | "y">> = {};
    if (input.title !== undefined) payload.title = input.title;
    if (input.content !== undefined) payload.content = input.content;
    if (input.x !== undefined) payload.x = input.x;
    if (input.y !== undefined) payload.y = input.y;

    return payload;
}

    export function createConnection(input: {
        from: number;
        to: number;
        fromAnchor: string;
        toAnchor: string;
    }): Omit<WorkflowConnection, "id"> {
        if(input.from === input.to) {
            throw new Error("자기 연결");
        }

        // 2. 입력 그대로 반환 (id 제외 객체)
        return {
            from: input.from,
            to: input.to,
            fromAnchor: input.fromAnchor,
            toAnchor: input.toAnchor
        };
}