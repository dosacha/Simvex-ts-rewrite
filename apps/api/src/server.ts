import Fastify from "fastify";
import { pathToFileURL } from "node:url";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { registerModelRoutes } from "./modules/models/routes";
import { registerStudyRoutes } from "./modules/study/routes";
import { registerAiRoutes } from "./modules/ai/routes";
import { registerMemoRoutes } from "./modules/memos/routes";
import { registerWorkflowRoutes } from "./modules/workflow/routes";

export async function buildServer() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  await app.register(multipart, {
    limits: {
      fileSize: 20 * 1024 * 1024,
    },
  });

  await registerModelRoutes(app);
  await registerStudyRoutes(app);
  await registerAiRoutes(app);
  await registerMemoRoutes(app);
  await registerWorkflowRoutes(app);

  app.get("/health", async () => ({ status: "ok" }));

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
