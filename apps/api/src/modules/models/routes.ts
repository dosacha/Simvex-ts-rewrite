import type { FastifyInstance } from "fastify";
import type { ExamSubmitRequest } from "@simvex/shared";
import {
  findModelById,
  generateExamQuestions,
  gradeExam,
} from "../../core/catalog";
import { repositories } from "../../core/repository";

export async function registerModelRoutes(app: FastifyInstance) {
  // models 메인 4개 라우트 (GET /models, /models/:id, /models/:id/parts, /models/:id/quizzes) 는
  // v2 라우트로 이전 완료. 아래는 exam + memos 라우트만 남김.

  app.get<{ Querystring: { modelIds?: string; count?: string } }>("/models/exam", async (request, reply) => {
    const idsText = request.query.modelIds?.trim();
    if (!idsText) return reply.code(400).send({ message: "modelIds 쿼리가 필요함." });

    const modelIds = idsText
      .split(",")
      .map((item) => Number(item.trim()))
      .filter((value) => Number.isInteger(value));

    if (modelIds.length === 0) return reply.code(400).send({ message: "유효한 modelIds가 없음." });

    const count = Number(request.query.count ?? 20);
    const questions = generateExamQuestions(modelIds, Number.isInteger(count) && count > 0 ? count : 20);
    return questions;
  });

  app.post<{ Body: ExamSubmitRequest }>("/models/exam/submit", async (request, reply) => {
    const answers = request.body?.answers;
    if (!Array.isArray(answers)) return reply.code(400).send({ message: "answers 배열이 필요함." });

    const graded = gradeExam(answers);
    const score = graded.total > 0 ? Math.round((graded.correctCount / graded.total) * 100) : 0;

    return {
      total: graded.total,
      correctCount: graded.correctCount,
      score,
      results: graded.results,
    };
  });

  app.get<{ Params: { id: string } }>("/models/:id/memos", async (request, reply) => {
    const id = Number(request.params.id);
    if (!Number.isInteger(id)) return reply.code(400).send({ message: "유효한 모델 ID가 아님." });

    const model = findModelById(id);
    if (!model) return reply.code(404).send({ message: "모델을 찾지 못함." });

    const userId = String(request.headers["x-user-id"] ?? "default-guest");
    return await repositories.memo.listByModel(userId, id);
  });

  app.post<{ Params: { id: string }; Body: { title?: string; content?: string } }>(
    "/models/:id/memos",
    async (request, reply) => {
      const id = Number(request.params.id);
      if (!Number.isInteger(id)) return reply.code(400).send({ message: "유효한 모델 ID가 아님." });

      const model = findModelById(id);
      if (!model) return reply.code(404).send({ message: "모델을 찾지 못함." });

      const userId = String(request.headers["x-user-id"] ?? "default-guest");
      const memo = await repositories.memo.create(userId, id, {
        title: request.body?.title ?? "",
        content: request.body?.content ?? "",
      });
      return reply.code(201).send(memo);
    },
  );
}
