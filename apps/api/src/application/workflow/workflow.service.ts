import type { WorkflowRepository, WorkflowNode, WorkflowConnection } from "../../core/repository";
import { 
  createNode as createNodeEntity, 
  updateNode as updateNodeEntity,
  createConnection as createConnectionEntity 
} from "../../domain/workflow/workflow.entity";

export class WorkflowService {
  constructor(private readonly repo: WorkflowRepository) {}
  
    async createNode(input: {
        userId: string;
        title: string;
        content: string;
        x: number;
        y: number;
    }): Promise<WorkflowNode> {
        // 1. entity.createNode 호출 — 검증된 payload 받음
        const payload = createNodeEntity({
        title: input.title,
        content: input.content,
        x: input.x,
        y: input.y,
        });
        
        // 2. repository.createNode 호출
        return this.repo.createNode(input.userId, payload);
    }

    async updateNode(input: {
        userId: string;
        nodeId: number;
        title?: string;
        content?: string;
        x?: number;
        y?: number;
    }): Promise<WorkflowNode | null> {
        const payload = updateNodeEntity({
            ...(input.title !== undefined && { title: input.title }),
            ...(input.content !== undefined && { content: input.content }),
            ...(input.x !== undefined && { x: input.x }),
            ...(input.y !== undefined && { y: input.y }),
        });

        return this.repo.updateNode(input.userId, input.nodeId, payload);
    }

    async deleteNode(input: {
        userId: string;
        nodeId: number;
    }): Promise<boolean> {
        return this.repo.deleteNode(input.userId, input.nodeId);
    }

    async createConnection(input: {
        userId: string;
        from: number;
        to: number;
        fromAnchor: string;
        toAnchor: string;
    }): Promise<WorkflowConnection | null> {
        const payload = createConnectionEntity({
            from: input.from,
            to: input.to,
            fromAnchor: input.fromAnchor,
            toAnchor: input.toAnchor,
        });
        
        return this.repo.createConnection(input.userId, payload);
    }

    async deleteConnection(input: {
        userId: string;
        connectionId: number;
    }): Promise<boolean> {
        return this.repo.deleteConnection(input.userId, input.connectionId);
    }
}