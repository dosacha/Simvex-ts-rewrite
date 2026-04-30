import Fastify from "fastify";
import { pathToFileURL } from "node:url";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { registerModelRoutes } from "./modules/models/routes";
import { registerStudyRoutes } from "./modules/study/routes";
import { registerWorkflowRoutes } from "./modules/workflow/routes";
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


export async function buildServer() {
  const app = Fastify({ logger: true });
  const configuredOrigins = (process.env.SIMVEX_CORS_ORIGINS ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
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

  await app.register(multipart, {
    limits: {
      fileSize: 20 * 1024 * 1024,
    },
  });
  await app.register(async (api) => {
    await registerModelRoutes(api);
    await registerStudyRoutes(api);
    await registerWorkflowRoutes(api);

    // v2 라우트 — memo
    const memoService = new MemoService(repositories.memo);
    const memoController = new MemoController(memoService);
    await registerMemoRoutesV2(api, memoController);

    // v2 라우트 — workflow
    const workflowService = new WorkflowService(repositories.workflow);
    const workflowController = new WorkflowController(workflowService);
    await registerWorkflowRoutesV2(api, workflowController);

    // v2 라우트 — ai
    const aiService = new AiService(repositories.aiHistory);
    const aiController = new AiController(aiService);
    await registerAiRoutesV2(api, aiController);

    // v2 라우트 — models (catalog 조회, repository 없음)
    const modelService = new ModelService();
    const modelController = new ModelController(modelService);
    await registerModelRoutesV2(api, modelController);

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
