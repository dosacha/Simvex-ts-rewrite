import type { FastifyInstance } from "fastify";
import type { ExamSubmitRequest } from "@simvex/shared";
import type { ExamController } from "./exam.controller";

export async function registerExamRoutesV2(app: FastifyInstance, controller: ExamController) {
  app.get<{ Querystring: { modelIds?: string; count?: string } }>(
    "/v2/exam",
    (request, reply) => controller.generateExam(request, reply),
  );

  app.post<{ Body: ExamSubmitRequest }>(
    "/v2/exam/submit",
    (request, reply) => controller.submitExam(request, reply),
  );
}