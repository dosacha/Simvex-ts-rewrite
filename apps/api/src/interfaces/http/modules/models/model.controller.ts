import type { FastifyRequest, FastifyReply } from "fastify";
import type { ModelService } from "../../../../application/models/model.service";
import { ModelNotFoundError } from "../../../../domain/shared/errors";

export class ModelController {
  constructor(private readonly service: ModelService) {}

  async listModels() {
    return this.service.listModels();
  }

  async findModel(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const id = Number(request.params.id);
    if (!Number.isInteger(id)) {
      return reply.code(400).send({ message: "유효한 모델 ID가 아닙니다." });
    }

    try {
      return this.service.findModel(id);
    } catch (error) {
      if (error instanceof ModelNotFoundError) {
        return reply.code(404).send({ message: "모델을 찾을 수 없습니다." });
      }
      throw error;
    }
  }

  async listParts(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const id = Number(request.params.id);
    if (!Number.isInteger(id)) {
      return reply.code(400).send({ message: "유효한 모델 ID가 아닙니다." });
    }

    try {
      return this.service.listParts(id);
    } catch (error) {
      if (error instanceof ModelNotFoundError) {
        return reply.code(404).send({ message: "모델을 찾을 수 없습니다." });
      }
      throw error;
    }
  }

  async listQuizzes(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const id = Number(request.params.id);
    if (!Number.isInteger(id)) {
      return reply.code(400).send({ message: "유효한 모델 ID가 아닙니다." });
    }

    try {
      return this.service.listQuizzes(id);
    } catch (error) {
      if (error instanceof ModelNotFoundError) {
        return reply.code(404).send({ message: "모델을 찾을 수 없습니다." });
      }
      throw error;
    }
  }
}
