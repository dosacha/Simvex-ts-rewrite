import type { FastifyInstance } from "fastify";
import type { ExamSubmitRequest } from "@simvex/shared";
import {
  findModelById,
  findPartsByModelId,
  findQuizzesByModelId,
  generateExamQuestions,
  getCatalogStore,
  gradeExam,
} from "../../core/catalog";
import { createMemo, listMemos } from "../../core/session-store";

export async function registerModelRoutes(app: FastifyInstance) {
  app.get("/api/models", async () => getCatalogStore().models);

  app.get<{ Params: { id: string } }>("/api/models/:id", async (request, reply) => {
    const id = Number(request.params.id);
    if (!Number.isInteger(id)) return reply.code(400).send({ message: "유효한 모델 ID가 아님." });

    const model = findModelById(id);
    if (!model) return reply.code(404).send({ message: "모델을 찾지 못함." });

    return model;
  });

  app.get<{ Params: { id: string } }>("/api/models/:id/parts", async (request, reply) => {
    const id = Number(request.params.id);
    if (!Number.isInteger(id)) return reply.code(400).send({ message: "유효한 모델 ID가 아님." });

    const model = findModelById(id);
    if (!model) return reply.code(404).send({ message: "모델을 찾지 못함." });

    return findPartsByModelId(id);
  });

  app.get<{ Params: { id: string } }>("/api/models/:id/quizzes", async (request, reply) => {
    const id = Number(request.params.id);
    if (!Number.isInteger(id)) return reply.code(400).send({ message: "유효한 모델 ID가 아님." });

    const model = findModelById(id);
    if (!model) return reply.code(404).send({ message: "모델을 찾지 못함." });

    return findQuizzesByModelId(id).map(({ answer: _answer, ...quiz }) => quiz);
  });

  app.get<{ Querystring: { modelIds?: string; count?: string } }>("/api/models/exam", async (request, reply) => {
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

  app.post<{ Body: ExamSubmitRequest }>("/api/models/exam/submit", async (request, reply) => {
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

  app.get<{ Params: { id: string } }>("/api/models/:id/memos", async (request, reply) => {
    const id = Number(request.params.id);
    if (!Number.isInteger(id)) return reply.code(400).send({ message: "유효한 모델 ID가 아님." });

    const model = findModelById(id);
    if (!model) return reply.code(404).send({ message: "모델을 찾지 못함." });

    const userId = String(request.headers["x-user-id"] ?? "default-guest");
    return listMemos(userId, id);
  });

  app.post<{ Params: { id: string }; Body: { title?: string; content?: string } }>(
    "/api/models/:id/memos",
    async (request, reply) => {
      const id = Number(request.params.id);
      if (!Number.isInteger(id)) return reply.code(400).send({ message: "유효한 모델 ID가 아님." });

      const model = findModelById(id);
      if (!model) return reply.code(404).send({ message: "모델을 찾지 못함." });

      const userId = String(request.headers["x-user-id"] ?? "default-guest");
      const memo = createMemo(userId, id, {
        title: request.body?.title ?? "",
        content: request.body?.content ?? "",
      });
      return reply.code(201).send(memo);
    },
  );
}
