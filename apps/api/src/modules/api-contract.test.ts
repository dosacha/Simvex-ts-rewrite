import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildServer } from "../server";
import { setCatalogImportDir } from "../core/catalog";
import { repositories } from "../core/repository";

function createImportFixture(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "simvex-api-contract-"));
  const filePath = path.join(root, "Data_ENGINE.json");
  fs.writeFileSync(
    filePath,
    JSON.stringify(
      {
        integrated_file: "ENGINE_BLOCK.glb",
        description: "fixture model",
        assets: [{ id: "part-1", title: "Piston", desc: "piston desc" }],
        quizzes: [
          {
            q: "Q1",
            opts: ["A", "B", "C", "D"],
            ans: 1,
          },
        ],
      },
      null,
      2,
    ),
    "utf-8",
  );
  return root;
}

function makeUserId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

test("GET /api/study/catalog: domain query 없이 기본 도메인으로 응답함", async (t) => {
  const fixtureDir = createImportFixture();
  setCatalogImportDir(fixtureDir);

  const app = await buildServer();
  t.after(() => app.close());

  const response = await app.inject({ method: "GET", url: "/api/study/catalog" });
  assert.equal(response.statusCode, 200);
  const payload = response.json() as { domainKey: string; categories: unknown[] };
  assert.equal(payload.domainKey, "engineering-dict");
  assert.equal(payload.categories.length, 1);
});

test("GET /api/v2/models/:id/quizzes: answer 필드를 노출하지 않음", async (t) => {
  const fixtureDir = createImportFixture();
  setCatalogImportDir(fixtureDir);

  const app = await buildServer();
  t.after(() => app.close());

  const modelRes = await app.inject({ method: "GET", url: "/api/v2/models" });
  assert.equal(modelRes.statusCode, 200);
  const models = modelRes.json() as Array<{ id: number }>;
  const firstModel = models[0];
  assert.ok(firstModel);

  const quizRes = await app.inject({ method: "GET", url: `/api/v2/models/${firstModel.id}/quizzes` });
  assert.equal(quizRes.statusCode, 200);
  const quizzes = quizRes.json() as Array<Record<string, unknown>>;
  assert.equal(quizzes.length, 1);

  const firstQuiz = quizzes[0];
  assert.ok(firstQuiz);
  assert.ok(!("answer" in firstQuiz));
});

test("memo 수정 API: 작성자와 다른 사용자 요청은 404를 반환함", async (t) => {
  const fixtureDir = createImportFixture();
  setCatalogImportDir(fixtureDir);

  const app = await buildServer();
  t.after(() => app.close());

  const modelRes = await app.inject({ method: "GET", url: "/api/v2/models" });
  assert.equal(modelRes.statusCode, 200);
  const models = modelRes.json() as Array<{ id: number }>;
  const firstModel = models[0];
  assert.ok(firstModel);

  const ownerId = makeUserId("owner");
  const otherId = makeUserId("other");

  const createRes = await app.inject({
    method: "POST",
    url: `/api/v2/models/${firstModel.id}/memos`,
    headers: {
      "x-user-id": ownerId,
      "content-type": "application/json",
    },
    payload: { title: "memo-1", content: "memo-content" },
  });
  assert.equal(createRes.statusCode, 201);
  const createdMemo = createRes.json() as { id: number };

  const updateByOtherUser = await app.inject({
    method: "PUT",
    url: `/api/v2/memos/${createdMemo.id}`,
    headers: {
      "x-user-id": otherId,
      "content-type": "application/json",
    },
    payload: { title: "hijack", content: "hijack" },
  });
  assert.equal(updateByOtherUser.statusCode, 404);

  const updateByOwner = await app.inject({
    method: "PUT",
    url: `/api/v2/memos/${createdMemo.id}`,
    headers: {
      "x-user-id": ownerId,
      "content-type": "application/json",
    },
    payload: { title: "updated", content: "updated-content" },
  });
  assert.equal(updateByOwner.statusCode, 200);
  const updated = updateByOwner.json() as { title: string; content: string };
  assert.equal(updated.title, "updated");
  assert.equal(updated.content, "updated-content");
});

test("workflow API: 사용자 소유권과 CRUD 계약을 유지함", async (t) => {
  const fixtureDir = createImportFixture();
  setCatalogImportDir(fixtureDir);

  const app = await buildServer();
  t.after(() => app.close());

  const ownerId = makeUserId("wf-owner");
  const otherId = makeUserId("wf-other");

  const nodeARes = await app.inject({
    method: "POST",
    url: "/api/v2/workflow/nodes",
    headers: {
      "x-user-id": ownerId,
      "content-type": "application/json",
    },
    payload: { title: "Node A", content: "A", x: 100, y: 120 },
  });
  assert.equal(nodeARes.statusCode, 201);
  const nodeA = nodeARes.json() as { id: number };

  const nodeBRes = await app.inject({
    method: "POST",
    url: "/api/v2/workflow/nodes",
    headers: {
      "x-user-id": ownerId,
      "content-type": "application/json",
    },
    payload: { title: "Node B", content: "B", x: 200, y: 220 },
  });
  assert.equal(nodeBRes.statusCode, 201);
  const nodeB = nodeBRes.json() as { id: number };

  const createConnRes = await app.inject({
    method: "POST",
    url: "/api/v2/workflow/connections",
    headers: {
      "x-user-id": ownerId,
      "content-type": "application/json",
    },
    payload: { from: nodeA.id, to: nodeB.id, fromAnchor: "right", toAnchor: "left" },
  });
  assert.equal(createConnRes.statusCode, 201);

  const ownerList = await app.inject({
    method: "GET",
    url: "/api/workflow",
    headers: { "x-user-id": ownerId },
  });
  assert.equal(ownerList.statusCode, 200);
  const ownerWorkflow = ownerList.json() as {
    nodes: Array<{ id: number }>;
    connections: Array<{ id: number; from: number; to: number }>;
  };
  assert.equal(ownerWorkflow.nodes.length, 2);
  assert.equal(ownerWorkflow.connections.length, 1);

  const otherList = await app.inject({
    method: "GET",
    url: "/api/workflow",
    headers: { "x-user-id": otherId },
  });
  assert.equal(otherList.statusCode, 200);
  const otherWorkflow = otherList.json() as { nodes: unknown[]; connections: unknown[] };
  assert.equal(otherWorkflow.nodes.length, 0);
  assert.equal(otherWorkflow.connections.length, 0);

  const updateByOther = await app.inject({
    method: "PUT",
    url: `/api/v2/workflow/nodes/${nodeA.id}`,
    headers: {
      "x-user-id": otherId,
      "content-type": "application/json",
    },
    payload: { title: "hijack" },
  });
  assert.equal(updateByOther.statusCode, 404);

  const deleteByOwner = await app.inject({
    method: "DELETE",
    url: `/api/v2/workflow/nodes/${nodeA.id}`,
    headers: { "x-user-id": ownerId },
  });
  assert.equal(deleteByOwner.statusCode, 204);
});

test("POST /api/ai/ask: 내부 오류 발생 시 마스킹된 에러를 반환함", async (t) => {
  const fixtureDir = createImportFixture();
  setCatalogImportDir(fixtureDir);

  const app = await buildServer();
  t.after(() => app.close());

  const originalAppend = repositories.aiHistory.append;
  repositories.aiHistory.append = async () => {
    throw new Error("upstream provider timeout details");
  };
  t.after(() => {
    repositories.aiHistory.append = originalAppend;
  });

  const modelRes = await app.inject({ method: "GET", url: "/api/v2/models" });
  assert.equal(modelRes.statusCode, 200);
  const models = modelRes.json() as Array<{ id: number }>;
  const firstModel = models[0];
  assert.ok(firstModel);

  const aiRes = await app.inject({
    method: "POST",
    url: "/api/v2/ai/ask",
    headers: {
      "content-type": "application/json",
      "x-user-id": makeUserId("ai-tester"),
    },
    payload: { modelId: firstModel.id, question: "테스트 질문" },
  });

  assert.equal(aiRes.statusCode, 502);
  const payload = aiRes.json() as { meta?: { error?: string }; answer?: string; context?: string };
  assert.equal(payload.meta?.error, "ai service unavailable");
  assert.equal(payload.answer, "");
  assert.equal(payload.context, "");
});

test("v2 인증 라우트: x-user-id 헤더 없으면 401을 반환함", async (t) => {
  const fixtureDir = createImportFixture();
  setCatalogImportDir(fixtureDir);

  const app = await buildServer();
  t.after(() => app.close());

  // memo: 헤더 없이 모델 메모 목록 요청
  const memoNoHeader = await app.inject({
    method: "GET",
    url: "/api/v2/models/1/memos",
  });
  assert.equal(memoNoHeader.statusCode, 401);

  // workflow: 헤더 없이 노드 생성 요청
  const workflowNoHeader = await app.inject({
    method: "POST",
    url: "/api/v2/workflow/nodes",
    headers: { "content-type": "application/json" },
    payload: { title: "Node", content: "", x: 0, y: 0 },
  });
  assert.equal(workflowNoHeader.statusCode, 401);

  // ai: 헤더 없이 ask 요청
  const aiNoHeader = await app.inject({
    method: "POST",
    url: "/api/v2/ai/ask",
    headers: { "content-type": "application/json" },
    payload: { modelId: 1, question: "?" },
  });
  assert.equal(aiNoHeader.statusCode, 401);

  // 빈 문자열 헤더도 401 (공백만 있는 케이스)
  const emptyHeader = await app.inject({
    method: "GET",
    url: "/api/v2/models/1/memos",
    headers: { "x-user-id": "   " },
  });
  assert.equal(emptyHeader.statusCode, 401);

  // 공용 라우트는 헤더 없어도 200 — 인증 경계가 정확히 분리되었는지 확인
  const publicCatalog = await app.inject({
    method: "GET",
    url: "/api/v2/models",
  });
  assert.equal(publicCatalog.statusCode, 200);
});