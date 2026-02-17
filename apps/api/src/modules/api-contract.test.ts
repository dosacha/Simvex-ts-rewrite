import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildServer } from "../server";
import { setCatalogImportDir } from "../core/catalog";

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

test("GET /api/study/catalog: domain 쿼리 없이도 기본 도메인으로 응답함", async (t) => {
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

test("GET /api/models/:id/quizzes: 정답 필드(answer)를 노출하지 않음", async (t) => {
  const fixtureDir = createImportFixture();
  setCatalogImportDir(fixtureDir);

  const app = await buildServer();
  t.after(() => app.close());

  const modelRes = await app.inject({ method: "GET", url: "/api/models" });
  assert.equal(modelRes.statusCode, 200);
  const models = modelRes.json() as Array<{ id: number }>;
  const firstModel = models[0];
  assert.ok(firstModel);

  const quizRes = await app.inject({ method: "GET", url: `/api/models/${firstModel.id}/quizzes` });
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

  const modelRes = await app.inject({ method: "GET", url: "/api/models" });
  assert.equal(modelRes.statusCode, 200);
  const models = modelRes.json() as Array<{ id: number }>;
  const firstModel = models[0];
  assert.ok(firstModel);

  const createRes = await app.inject({
    method: "POST",
    url: `/api/models/${firstModel.id}/memos`,
    headers: {
      "x-user-id": "owner-user",
      "content-type": "application/json",
    },
    payload: { title: "memo-1", content: "memo-content" },
  });
  assert.equal(createRes.statusCode, 201);
  const createdMemo = createRes.json() as { id: number };

  const updateByOtherUser = await app.inject({
    method: "PUT",
    url: `/api/memos/${createdMemo.id}`,
    headers: {
      "x-user-id": "other-user",
      "content-type": "application/json",
    },
    payload: { title: "hijack", content: "hijack" },
  });
  assert.equal(updateByOtherUser.statusCode, 404);

  const updateByOwner = await app.inject({
    method: "PUT",
    url: `/api/memos/${createdMemo.id}`,
    headers: {
      "x-user-id": "owner-user",
      "content-type": "application/json",
    },
    payload: { title: "updated", content: "updated-content" },
  });
  assert.equal(updateByOwner.statusCode, 200);
  const updated = updateByOwner.json() as { title: string; content: string };
  assert.equal(updated.title, "updated");
  assert.equal(updated.content, "updated-content");
});
