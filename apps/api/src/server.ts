import Fastify from "fastify";
import { pathToFileURL } from "node:url";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { registerStudyRoutes } from "./modules/study/routes";
import { registerMemoRoutesV2 } from "./interfaces/http/modules/memos/memo.routes";
import { MemoService } from "./application/memos/memo.service";
import { MemoController } from "./interfaces/http/modules/memos/memo.controller";
import { repositories } from "./core/repository";
import { WorkflowService } from "./application/workflow/workflow.service";
import { WorkflowController } from "./interfaces/http/modules/workflow/workflow.controller";
import { registerWorkflowRoutesV2 } from "./interfaces/http/modules/workflow/workflow.routes";
import { AiService } from "./application/ai/ai.service";
import { AiController } from "./interfaces/http/modules/ai/ai.controller";
import { registerAiRoutesV2 } from "./interfaces/http/modules/ai/ai.routes";
import { ModelService } from "./application/models/model.service";
import { ModelController } from "./interfaces/http/modules/models/model.controller";
import { registerModelRoutesV2 } from "./interfaces/http/modules/models/model.routes";
import { ExamService } from "./application/exam/exam.service";
import { ExamController } from "./interfaces/http/modules/exam/exam.controller";
import { registerExamRoutesV2 } from "./interfaces/http/modules/exam/exam.routes";
import { registerAuthPlugin } from "./interfaces/http/plugins/auth.plugin";
import { WorkflowFileService } from "./application/workflow/file.service";
import { WorkflowFileController } from "./interfaces/http/modules/workflow/file.controller";
import { registerWorkflowFileRoutesV2 } from "./interfaces/http/modules/workflow/file.routes";

export async function buildServer() {
  const app = Fastify({ logger: true });
  const configuredOrigins = (process.env.SIMVEX_CORS_ORIGINS ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  /**
   * CORS allowlist + credentials 정책.
   *
   * production 배포 시 SIMVEX_CORS_ORIGINS 환경 변수 (콤마 구분) 설정 필수.
   * 미설정 시 localhost dev 만 허용 — 운영 환경 변수 누락 시 외부 노출 방지 fail-safe.
   *
   * credentials: true 의 의미:
   *   - 브라우저 cross-origin 요청에 cookie / Authorization 헤더 포함 허용
   *   - 향후 cookie 기반 인증 도입 시 필요
   *   - 현재 x-user-id 헤더 인증이라 cookie 미사용이지만 호환성 위해 유지
   *
   * origin 이 없는 요청 (curl, server-to-server) 통과:
   *   - 의도된 동작 — 같은 호스트 / 동일 출처 내 호출 허용
   *   - 외부 cross-origin 만 차단
   */
  const allowlist = new Set(
    configuredOrigins.length > 0 ? configuredOrigins : ["http://localhost:5173", "http://127.0.0.1:5173"],
  );

  await app.register(cors, {
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowlist.has(origin)) return callback(null, true);
      return callback(new Error("CORS origin not allowed"), false);
    },
    credentials: true,
  });
  
  await app.register(async (api) => {
    // legacy 라우트 — v1, 인증 미적용 (점진적 deprecate 예정)
    await registerStudyRoutes(api);

    // v2 공용 라우트 — 카탈로그 조회 (사용자별 데이터 아님, 인증 미적용)
    const modelService = new ModelService();
    const modelController = new ModelController(modelService);
    await registerModelRoutesV2(api, modelController);

    const examService = new ExamService();
    const examController = new ExamController(examService);
    await registerExamRoutesV2(api, examController);

    // v2 인증 라우트 — 사용자별 리소스 (memo / workflow / ai)
    // encapsulation: 이 register 안에서만 auth plugin hook 이 동작.
    await api.register(async (authed) => {
      await registerAuthPlugin(authed);

      // multipart register 위치: auth plugin scope 안으로 이동.
      // 이유: 미인증 요청이 multipart buffer 를 메모리에 적재하기 전에 401 반환되어야 함.      // (auth plugin 밖에서 register 시 미인증 클라이언트가 buffer 적재 가능 → DoS 위험)
      await authed.register(multipart, {
        // 단일 파일 최대 20MB.
        // 의사결정: 학습용 자료 / 다이어그램 이미지가 주 use case 라 20MB 가 충분.
        // 추후 video / 대용량 파일 도입 시 환경 변수로 분리 + 서버 메모리 / 디스크 정책 재검토.
        limits: {
          fileSize: 20 * 1024 * 1024,
        },
      });

      const memoService = new MemoService(repositories.memo);
      const memoController = new MemoController(memoService);
      await registerMemoRoutesV2(authed, memoController);

      const workflowService = new WorkflowService(repositories.workflow);
      const workflowController = new WorkflowController(workflowService);
      await registerWorkflowRoutesV2(authed, workflowController);

      const workflowFileService = new WorkflowFileService(repositories.workflow);
      const workflowFileController = new WorkflowFileController(workflowFileService);
      await registerWorkflowFileRoutesV2(authed, workflowFileController);

      const aiService = new AiService(repositories.aiHistory);
      const aiController = new AiController(aiService);
      await registerAiRoutesV2(authed, aiController);
    });

    api.get("/health", async () => ({ status: "ok" }));
  }, { prefix: "/api" });

  return app;
}

async function startServer() {
  const port = Number(process.env.PORT ?? 8080);
  const host = process.env.HOST ?? "0.0.0.0";

  try {
    const app = await buildServer();
    await app.listen({ port, host });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

const directRunArg = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === directRunArg) {
  void startServer();
}
