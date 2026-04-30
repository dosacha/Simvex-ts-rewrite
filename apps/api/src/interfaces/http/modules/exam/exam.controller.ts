import type { FastifyRequest, FastifyReply } from "fastify";
import type { ExamSubmitRequest } from "@simvex/shared";
import type { ExamService } from "../../../../application/exam/exam.service";
import { ExamInputError } from "../../../../domain/exam/exam.entity";

export class ExamController {
  constructor(private readonly service: ExamService) {}

  async generateExam(
    request: FastifyRequest<{ Querystring: { modelIds?: string; count?: string } }>,
    reply: FastifyReply,
  ) {
    try {
      return this.service.generateQuestions({
        modelIdsText: request.query.modelIds,
        countRaw: request.query.count,
      });
    } catch (error) {
      if (error instanceof ExamInputError) {
        return reply.code(400).send({ message: error.message });
      }
      throw error;
    }
  }

  async submitExam(
    request: FastifyRequest<{ Body: ExamSubmitRequest }>,
    reply: FastifyReply,
  ) {
    try {
      return this.service.gradeAndScore({
        answers: request.body?.answers,
      });
    } catch (error) {
      if (error instanceof ExamInputError) {
        return reply.code(400).send({ message: error.message });
      }
      throw error;
    }
  }
}