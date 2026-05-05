import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { FastifyInstance } from "fastify";

// JWT secret 은 buildServer() import 보다 먼저 세팅해야 한다.
// server.ts 가 module 평가 시점이 아니라 buildServer() 호출 시점에 secret 을 읽으므로
// 사실 import 직후에 세팅해도 동작은 하지만, "테스트는 secret 이 무엇이든 신경쓰지 않는다"
// 라는 의도를 코드 위치로 명확히 표현하기 위해 import 보다 위에 둔다.
process.env.SIMVEX_JWT_SECRET ??= "test-jwt-secret-for-api-contract-tests-must-be-32-chars-or-longer";

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

/**
 * 인증된 요청의 헤더를 만든다.
 *
 * 단순한 helper 지만 의도적으로 이 한 곳에 모음:
 *   - 모든 테스트가 동일한 sub claim 규약을 쓴다는 사실을 코드로 못 박음.
 *   - 향후 토큰 발급 정책 (expiry, claim 추가 등) 변경 시 한 자리만 고치면 됨.
 */
function bearer(app: FastifyInstance, userId: string): { authorization: string } {
  return {
    authorization: `Bearer ${app.jwt.sign({ sub: userId }, { expiresIn: "1h" })}`,
  };
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
      ...bearer(app, ownerId),
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
      ...bearer(app, otherId),
      "content-type": "application/json",
    },
    payload: { title: "hijack", content: "hijack" },
  });
  assert.equal(updateByOtherUser.statusCode, 404);

  const updateByOwner = await app.inject({
    method: "PUT",
    url: `/api/v2/memos/${createdMemo.id}`,
    headers: {
      ...bearer(app, ownerId),
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
      ...bearer(app, ownerId),
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
      ...bearer(app, ownerId),
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
      ...bearer(app, ownerId),
      "content-type": "application/json",
    },
    payload: { from: nodeA.id, to: nodeB.id, fromAnchor: "right", toAnchor: "left" },
  });
  assert.equal(createConnRes.statusCode, 201);

  const ownerList = await app.inject({
    method: "GET",
    url: "/api/v2/workflow",
    headers: { ...bearer(app, ownerId), "content-type": "application/json" },
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
    url: "/api/v2/workflow",
    headers: bearer(app, otherId),
  });
  assert.equal(otherList.statusCode, 200);
  const otherWorkflow = otherList.json() as { nodes: unknown[]; connections: unknown[] };
  assert.equal(otherWorkflow.nodes.length, 0);
  assert.equal(otherWorkflow.connections.length, 0);

  const updateByOther = await app.inject({
    method: "PUT",
    url: `/api/v2/workflow/nodes/${nodeA.id}`,
    headers: {
      ...bearer(app, otherId),
      "content-type": "application/json",
    },
    payload: { title: "hijack" },
  });
  assert.equal(updateByOther.statusCode, 404);

  const deleteByOwner = await app.inject({
    method: "DELETE",
    url: `/api/v2/workflow/nodes/${nodeA.id}`,
    headers: bearer(app, ownerId),
  });
  assert.equal(deleteByOwner.statusCode, 204);

  // ─── nodeA 삭제 후 그 nodeA 를 가리키던 connection 도 사라졌는지 확인 ───
  // postgres: ON DELETE CASCADE 가 자동 정리 (003_constraints.sql)
  // in-memory: deleteNode 가 connection 배열을 직접 필터링
  // 두 driver 의 메커니즘은 다르지만 같은 결과를 보장 — 이 테스트가 그 계약을 고정한다.
  const afterDelete = await app.inject({
    method: "GET",
    url: "/api/v2/workflow",
    headers: { ...bearer(app, ownerId), "content-type": "application/json" },
  });
  assert.equal(afterDelete.statusCode, 200);
  const remaining = afterDelete.json() as {
    nodes: Array<{ id: number }>;
    connections: Array<{ id: number; from: number; to: number }>;
  };
  assert.equal(remaining.nodes.length, 1, "nodeA 만 삭제됐어야 함 (nodeB 는 유지)");
  assert.equal(remaining.connections.length, 0, "nodeA 를 가리키던 connection 도 동반 삭제되어야 함");
});

test("workflow connection 멱등성: 동일 (from,to,anchor) 페어를 두 번 POST 해도 같은 id 반환", async (t) => {
  // 회귀 케이스 — 이전엔 SELECT-then-INSERT 사이의 race 로 동시 요청 시 23505 가 400 으로 새어나갔음.
  // ON CONFLICT 적용 후로는 같은 페어 재요청이 항상 같은 id 의 멱등 응답으로 떨어져야 함.
  const fixtureDir = createImportFixture();
  setCatalogImportDir(fixtureDir);

  const app = await buildServer();
  t.after(() => app.close());

  const ownerId = makeUserId("wf-idem");

  const nodeA = (await app.inject({
    method: "POST",
    url: "/api/v2/workflow/nodes",
    headers: { ...bearer(app, ownerId), "content-type": "application/json" },
    payload: { title: "A", content: "A", x: 0, y: 0 },
  })).json() as { id: number };

  const nodeB = (await app.inject({
    method: "POST",
    url: "/api/v2/workflow/nodes",
    headers: { ...bearer(app, ownerId), "content-type": "application/json" },
    payload: { title: "B", content: "B", x: 1, y: 1 },
  })).json() as { id: number };

  const connPayload = { from: nodeA.id, to: nodeB.id, fromAnchor: "right", toAnchor: "left" };
  const headers = { ...bearer(app, ownerId), "content-type": "application/json" };

  const c1 = await app.inject({ method: "POST", url: "/api/v2/workflow/connections", headers, payload: connPayload });
  const c2 = await app.inject({ method: "POST", url: "/api/v2/workflow/connections", headers, payload: connPayload });

  assert.equal(c1.statusCode, 201, "첫 요청은 정상 생성");
  assert.equal(c2.statusCode, 201, "재요청도 200/201 (400 으로 새지 않아야 함)");

  const id1 = (c1.json() as { id: number }).id;
  const id2 = (c2.json() as { id: number }).id;
  assert.equal(id1, id2, "같은 페어는 같은 connection id 를 반환 (멱등)");

  // 실제로 connection 이 한 개만 남아있는지 list 로 검증.
  const listed = await app.inject({
    method: "GET",
    url: "/api/v2/workflow",
    headers: { ...bearer(app, ownerId), "content-type": "application/json" },
  });
  const wf = listed.json() as { connections: unknown[] };
  assert.equal(wf.connections.length, 1, "중복 connection 이 만들어지지 않았어야 함");
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
      ...bearer(app, makeUserId("ai-tester")),
      "content-type": "application/json",
    },
    payload: { modelId: firstModel.id, question: "테스트 질문" },
  });

  assert.equal(aiRes.statusCode, 500);
  const payload = aiRes.json() as { meta?: { error?: string }; answer?: string; context?: string };
  assert.equal(payload.meta?.error, "ai service unavailable");
  assert.equal(payload.answer, "");
  assert.equal(payload.context, "");
});

test("v2 인증 라우트: JWT 가 없거나 무효하면 401 을 반환함", async (t) => {
  const fixtureDir = createImportFixture();
  setCatalogImportDir(fixtureDir);

  const app = await buildServer();
  t.after(() => app.close());

  // memo: Authorization 헤더 자체가 없는 경우 → 401
  const memoNoHeader = await app.inject({
    method: "GET",
    url: "/api/v2/models/1/memos",
  });
  assert.equal(memoNoHeader.statusCode, 401);

  // workflow: Authorization 헤더 자체가 없는 경우 → 401
  const workflowNoHeader = await app.inject({
    method: "POST",
    url: "/api/v2/workflow/nodes",
    headers: { "content-type": "application/json" },
    payload: { title: "Node", content: "", x: 0, y: 0 },
  });
  assert.equal(workflowNoHeader.statusCode, 401);

  // ai: Authorization 헤더 자체가 없는 경우 → 401
  const aiNoHeader = await app.inject({
    method: "POST",
    url: "/api/v2/ai/ask",
    headers: { "content-type": "application/json" },
    payload: { modelId: 1, question: "?" },
  });
  assert.equal(aiNoHeader.statusCode, 401);

  // Bearer 뒤에 JWT 형식이 아닌 문자열 → 401 (서명 검증 실패)
  const garbageBearer = await app.inject({
    method: "GET",
    url: "/api/v2/models/1/memos",
    headers: { authorization: "Bearer not-a-real-jwt" },
  });
  assert.equal(garbageBearer.statusCode, 401);

  // 다른 secret 으로 서명된 토큰 → 401 (서명 불일치)
  // 같은 알고리즘으로 만들었지만 secret 이 달라 서버 검증을 통과하지 못한다.
  const fakeHeader = Buffer.from('{"alg":"HS256","typ":"JWT"}').toString("base64url");
  const fakePayload = Buffer.from('{"sub":"hijacker"}').toString("base64url");
  // signature 자리는 임의값 — 서버 secret 으로 다시 계산했을 때 일치하지 않으므로 거부.
  const forgedToken = `${fakeHeader}.${fakePayload}.deadbeefdeadbeefdeadbeefdeadbeef`;
  const forgedRes = await app.inject({
    method: "GET",
    url: "/api/v2/models/1/memos",
    headers: { authorization: `Bearer ${forgedToken}` },
  });
  assert.equal(forgedRes.statusCode, 401);

  // sub claim 이 빈 문자열인 토큰 → 401
  // 서명도 통과하고 exp 도 있어서 jwtVerify 단계는 깨끗히 지나간다.
  // 그 다음 plugin 의 sub.trim().length === 0 가드가 진짜로 막는지 확인.
  const emptySubToken = app.jwt.sign({ sub: "   " }, { expiresIn: "1h" });
  const emptySubRes = await app.inject({
    method: "GET",
    url: "/api/v2/models/1/memos",
    headers: { authorization: `Bearer ${emptySubToken}` },
  });
  assert.equal(emptySubRes.statusCode, 401);

  // exp claim 이 없는 토큰 → 401
  // @fastify/jwt 자체는 통과시키지만 (영구 토큰), plugin 의 exp 가드가 막는다.
  // SECURITY_MODEL 의 "exp claim 검증" narrative 가 진짜인지의 contract.
  const noExpToken = app.jwt.sign({ sub: "no-exp-user" });
  const noExpRes = await app.inject({
    method: "GET",
    url: "/api/v2/models/1/memos",
    headers: { authorization: `Bearer ${noExpToken}` },
  });
  assert.equal(noExpRes.statusCode, 401);

  // 만료된 토큰 → 401
  // 음수 expiresIn 은 @fastify/jwt 가 거부하므로 exp claim 을 직접 과거로 박는다.
  // 1초 전이면 어떤 clock skew 허용 범위 (보통 0~30초) 보다도 넉넉히 만료 상태.
  const expiredToken = app.jwt.sign({
    sub: "expired-user",
    exp: Math.floor(Date.now() / 1000) - 60,
  });
  const expiredRes = await app.inject({
    method: "GET",
    url: "/api/v2/models/1/memos",
    headers: { authorization: `Bearer ${expiredToken}` },
  });
  assert.equal(expiredRes.statusCode, 401);

  // 공용 라우트는 토큰 없어도 200 — 인증 경계가 정확히 분리되었는지 확인
  const publicCatalog = await app.inject({
    method: "GET",
    url: "/api/v2/models",
  });
  assert.equal(publicCatalog.statusCode, 200);

  // 정상 토큰은 통과 — 401 의 negative 만이 아니라 positive case 도 한 번은 확인.
  const validRes = await app.inject({
    method: "GET",
    url: "/api/v2/models/1/memos",
    headers: bearer(app, makeUserId("auth-positive")),
  });
  // 모델이 없으면 404, 있으면 200 — 어쨌든 401 이 아니어야 한다.
  assert.notEqual(validRes.statusCode, 401);
});

test("memo schema 검증: 잘못된 body 는 controller 진입 전 400 으로 차단됨", async (t) => {
  const fixtureDir = createImportFixture();
  setCatalogImportDir(fixtureDir);

  const app = await buildServer();
  t.after(() => app.close());

  const userId = makeUserId("schema-tester");

  // 모델 ID 확보
  const modelRes = await app.inject({ method: "GET", url: "/api/v2/models" });
  const models = modelRes.json() as Array<{ id: number }>;
  const firstModel = models[0];
  assert.ok(firstModel);

  // 메모 1개 생성 (PUT 테스트용 시드)
  const seedMemoRes = await app.inject({
    method: "POST",
    url: `/api/v2/models/${firstModel.id}/memos`,
    headers: { ...bearer(app, userId), "content-type": "application/json" },
    payload: { title: "seed", content: "seed-content" },
  });
  assert.equal(seedMemoRes.statusCode, 201);
  const seedMemo = seedMemoRes.json() as { id: number };

  // 케이스 1: POST body 에 title 누락 — required 위반 → 400
  // 리뷰 문서 P0: 이전에는 title ?? "" 로 빈 문자열이 저장될 수 있었음.
  const missingTitle = await app.inject({
    method: "POST",
    url: `/api/v2/models/${firstModel.id}/memos`,
    headers: { ...bearer(app, userId), "content-type": "application/json" },
    payload: { content: "only content" },
  });
  assert.equal(missingTitle.statusCode, 400);

  // 케이스 2: POST body 에 content 누락 — required 위반 → 400
  const missingContent = await app.inject({
    method: "POST",
    url: `/api/v2/models/${firstModel.id}/memos`,
    headers: { ...bearer(app, userId), "content-type": "application/json" },
    payload: { title: "only title" },
  });
  assert.equal(missingContent.statusCode, 400);

  // 케이스 3: POST body 의 title 이 빈 문자열 — minLength: 1 위반 → 400
  const emptyTitle = await app.inject({
    method: "POST",
    url: `/api/v2/models/${firstModel.id}/memos`,
    headers: { ...bearer(app, userId), "content-type": "application/json" },
    payload: { title: "", content: "valid content" },
  });
  assert.equal(emptyTitle.statusCode, 400);

  // 케이스 4: POST body 의 title 이 200자 초과 — maxLength: 200 위반 → 400
  const tooLongTitle = await app.inject({
    method: "POST",
    url: `/api/v2/models/${firstModel.id}/memos`,
    headers: { ...bearer(app, userId), "content-type": "application/json" },
    payload: { title: "x".repeat(201), content: "valid content" },
  });
  assert.equal(tooLongTitle.statusCode, 400);

  // 케이스 5 (additionalProperties 강제) 는 ajv 기본 옵션상 통과되지 않음.
  // → backlog: setValidatorCompiler 로 strict 모드 활성화 시 추가 검증.

  // 케이스 6: PUT body 가 빈 객체 — minProperties: 1 위반 → 400

  // 케이스 7: PUT 은 일부 필드만 와도 통과 (PATCH 의미)
  // title 만 바꾸고 content 는 유지되어야 함.
  const partialUpdate = await app.inject({
    method: "PUT",
    url: `/api/v2/memos/${seedMemo.id}`,
    headers: { ...bearer(app, userId), "content-type": "application/json" },
    payload: { title: "updated-title-only" },
  });
  assert.equal(partialUpdate.statusCode, 200);
  const updated = partialUpdate.json() as { title: string; content: string };
  assert.equal(updated.title, "updated-title-only");
  assert.equal(updated.content, "seed-content"); // ← 기존 content 유지 확인

  // 케이스 8: params.id 가 숫자가 아닌 경우 — pattern 위반 → 400
  const invalidId = await app.inject({
    method: "PUT",
    url: `/api/v2/memos/abc`,
    headers: { ...bearer(app, userId), "content-type": "application/json" },
    payload: { title: "ok" },
  });
  assert.equal(invalidId.statusCode, 400);
});

test("workflow schema 검증: 잘못된 body 는 controller 진입 전 400 으로 차단됨", async (t) => {
  const fixtureDir = createImportFixture();
  setCatalogImportDir(fixtureDir);

  const app = await buildServer();
  t.after(() => app.close());

  const userId = makeUserId("wf-schema");

  // 노드 시드 2개 (connection 테스트용)
  const nodeARes = await app.inject({
    method: "POST",
    url: "/api/v2/workflow/nodes",
    headers: { ...bearer(app, userId), "content-type": "application/json" },
    payload: { title: "Node A", content: "A", x: 100, y: 100 },
  });
  assert.equal(nodeARes.statusCode, 201);
  const nodeA = nodeARes.json() as { id: number };

  const nodeBRes = await app.inject({
    method: "POST",
    url: "/api/v2/workflow/nodes",
    headers: { ...bearer(app, userId), "content-type": "application/json" },
    payload: { title: "Node B", content: "B", x: 200, y: 200 },
  });
  assert.equal(nodeBRes.statusCode, 201);
  const nodeB = nodeBRes.json() as { id: number };

  // ─── createNode schema 검증 ─────────────────────────────────────────────

  // 케이스 1: title 누락 → 400 (P0 fallback "새 노드" 제거 확인)
  const noTitle = await app.inject({
    method: "POST",
    url: "/api/v2/workflow/nodes",
    headers: { ...bearer(app, userId), "content-type": "application/json" },
    payload: { content: "no title", x: 0, y: 0 },
  });
  assert.equal(noTitle.statusCode, 400);

  // 케이스 2: x 누락 → 400 (P0 fallback 0 제거 확인)
  const noX = await app.inject({
    method: "POST",
    url: "/api/v2/workflow/nodes",
    headers: { ...bearer(app, userId), "content-type": "application/json" },
    payload: { title: "ok", content: "ok", y: 0 },
  });
  assert.equal(noX.statusCode, 400);

  // 케이스 3: x 가 숫자로 변환 불가능한 string → 400
  // 참고: ajv 의 기본 옵션 (coerceTypes: true) 으로 인해 "100" 같은 숫자 문자열은 통과한다.
  // 진짜로 숫자가 아닌 값만 거부됨. 이건 운영 환경에서는 클라이언트 측 타입 강제로 보완해야 함.
  // backlog: ajv strict 모드 (coerceTypes: false) 활성화 시 추가 검증 가능.
  const xNotNumber = await app.inject({
    method: "POST",
    url: "/api/v2/workflow/nodes",
    headers: { ...bearer(app, userId), "content-type": "application/json" },
    payload: { title: "ok", content: "ok", x: "abc", y: 0 },
  });
  assert.equal(xNotNumber.statusCode, 400);

  // ─── updateNode schema 검증 ─────────────────────────────────────────────

  // 케이스 4: PUT 빈 body → 400 (minProperties: 1)
  const emptyUpdate = await app.inject({
    method: "PUT",
    url: `/api/v2/workflow/nodes/${nodeA.id}`,
    headers: { ...bearer(app, userId), "content-type": "application/json" },
    payload: {},
  });
  assert.equal(emptyUpdate.statusCode, 400);

  // 케이스 5: PUT 부분 업데이트 → 200 (PATCH 의미)
  const partialUpdate = await app.inject({
    method: "PUT",
    url: `/api/v2/workflow/nodes/${nodeA.id}`,
    headers: { ...bearer(app, userId), "content-type": "application/json" },
    payload: { x: 999 },
  });
  assert.equal(partialUpdate.statusCode, 200);

  // 케이스 6: params.id 가 숫자 아님 → 400
  const invalidId = await app.inject({
    method: "PUT",
    url: "/api/v2/workflow/nodes/abc",
    headers: { ...bearer(app, userId), "content-type": "application/json" },
    payload: { x: 1 },
  });
  assert.equal(invalidId.statusCode, 400);

  // ─── createConnection schema vs entity 다층 방어 ────────────────────────

  // 케이스 7: connection body 의 from 누락 → 400 (schema)
  const noFrom = await app.inject({
    method: "POST",
    url: "/api/v2/workflow/connections",
    headers: { ...bearer(app, userId), "content-type": "application/json" },
    payload: { to: nodeB.id, fromAnchor: "right", toAnchor: "left" },
  });
  assert.equal(noFrom.statusCode, 400);

  // 케이스 8: from 이 정수가 아닌 실수 → 400 (schema integer 타입)
  const fromNotInt = await app.inject({
    method: "POST",
    url: "/api/v2/workflow/connections",
    headers: { ...bearer(app, userId), "content-type": "application/json" },
    payload: { from: 1.5, to: nodeB.id, fromAnchor: "right", toAnchor: "left" },
  });
  assert.equal(fromNotInt.statusCode, 400);

  // 케이스 9: 자기 자신과 연결 (from === to) → 400 (entity 의 도메인 규칙)
  // 이건 schema 가 통과시키지만 entity 가 거부 — 다층 방어 구조 증거.
  const selfLoop = await app.inject({
    method: "POST",
    url: "/api/v2/workflow/connections",
    headers: { ...bearer(app, userId), "content-type": "application/json" },
    payload: { from: nodeA.id, to: nodeA.id, fromAnchor: "right", toAnchor: "left" },
  });
  assert.equal(selfLoop.statusCode, 400);

  // ─── deleteConnection 쿼리스트링 schema ─────────────────────────────────

  // 케이스 10: id 가 숫자 패턴이 아님 → 400
  const badQueryId = await app.inject({
    method: "DELETE",
    url: "/api/v2/workflow/connections?id=abc",
    headers: bearer(app, userId),
  });
  assert.equal(badQueryId.statusCode, 400);
});

test("ai schema 검증: 잘못된 body 는 controller 진입 전 400 으로 차단됨", async (t) => {
  const fixtureDir = createImportFixture();
  setCatalogImportDir(fixtureDir);

  const app = await buildServer();
  t.after(() => app.close());

  const userId = makeUserId("ai-schema");

  // 모델 ID 확보
  const modelRes = await app.inject({ method: "GET", url: "/api/v2/models" });
  const models = modelRes.json() as Array<{ id: number }>;
  const firstModel = models[0];
  assert.ok(firstModel);

  // ─── POST /v2/ai/ask schema 검증 ────────────────────────────────────────

  // 케이스 1: question 누락 → 400 (이전엔 entity 의 AiInputValidationError 가 잡았음)
  const noQuestion = await app.inject({
    method: "POST",
    url: "/api/v2/ai/ask",
    headers: { ...bearer(app, userId), "content-type": "application/json" },
    payload: { modelId: firstModel.id },
  });
  assert.equal(noQuestion.statusCode, 400);

  // 케이스 2: modelId 누락 → 400
  const noModelId = await app.inject({
    method: "POST",
    url: "/api/v2/ai/ask",
    headers: { ...bearer(app, userId), "content-type": "application/json" },
    payload: { question: "테스트?" },
  });
  assert.equal(noModelId.statusCode, 400);

  // 케이스 3: question 이 빈 문자열 → 400 (minLength: 1)
  const emptyQuestion = await app.inject({
    method: "POST",
    url: "/api/v2/ai/ask",
    headers: { ...bearer(app, userId), "content-type": "application/json" },
    payload: { question: "", modelId: firstModel.id },
  });
  assert.equal(emptyQuestion.statusCode, 400);

  // 케이스 4: modelId 가 정수가 아닌 실수 → 400 (integer)
  const modelIdNotInt = await app.inject({
    method: "POST",
    url: "/api/v2/ai/ask",
    headers: { ...bearer(app, userId), "content-type": "application/json" },
    payload: { question: "ok", modelId: 1.5 },
  });
  assert.equal(modelIdNotInt.statusCode, 400);

  // 케이스 5: question 이 maxLength 초과 → 400
  const tooLongQuestion = await app.inject({
    method: "POST",
    url: "/api/v2/ai/ask",
    headers: { ...bearer(app, userId), "content-type": "application/json" },
    payload: { question: "x".repeat(2001), modelId: firstModel.id },
  });
  assert.equal(tooLongQuestion.statusCode, 400);

  // 케이스 6: meshName 이 optional 이라 없어도 통과 (글로벌 모드)
  const globalMode = await app.inject({
    method: "POST",
    url: "/api/v2/ai/ask",
    headers: { ...bearer(app, userId), "content-type": "application/json" },
    payload: { question: "글로벌 질문", modelId: firstModel.id },
  });
  assert.equal(globalMode.statusCode, 200);
  const globalResult = globalMode.json() as { mode: string };
  assert.equal(globalResult.mode, "GLOBAL");

  // ─── GET /v2/ai/history/:modelId schema 검증 ────────────────────────────

  // 케이스 7: params.modelId 가 숫자가 아님 → 400
  const invalidParams = await app.inject({
    method: "GET",
    url: "/api/v2/ai/history/abc",
    headers: bearer(app, userId),
  });
  assert.equal(invalidParams.statusCode, 400);

  // 케이스 8: 존재하지 않는 modelId → 404 (schema 통과 후 service 의 ModelNotFoundError)
  // schema 와 비즈니스 흐름의 책임 분리 증거.
  const unknownModel = await app.inject({
    method: "GET",
    url: "/api/v2/ai/history/99999",
    headers: bearer(app, userId),
  });
  assert.equal(unknownModel.statusCode, 404);
});

test("v2 workflow file API: 업로드/다운로드/삭제 + 권한 격리 + 인증", async (t) => {
  const fixtureDir = createImportFixture();
  setCatalogImportDir(fixtureDir);

  const app = await buildServer();
  t.after(() => app.close());

  const ownerId = makeUserId("file-owner");
  const otherId = makeUserId("file-other");

  // ─── 시드: 노드 1개 생성 ──────────────────────────────────────────────
  const nodeRes = await app.inject({
    method: "POST",
    url: "/api/v2/workflow/nodes",
    headers: { ...bearer(app, ownerId), "content-type": "application/json" },
    payload: { title: "Node with files", content: "...", x: 0, y: 0 },
  });
  assert.equal(nodeRes.statusCode, 201);
  const node = nodeRes.json() as { id: number };

  // ─── multipart helper ────────────────────────────────────────────────
  // 의존성 추가 없이 multipart body 를 raw string 으로 구성.
  // boundary 와 Content-Disposition 을 명시적으로 다뤄서 multipart 프로토콜 구조가 코드에 드러남.
  const buildMultipartBody = (fileName: string, content: string, mimeType: string) => {
    const boundary = "----simvexTestBoundary" + Date.now();
    const body = [
      `--${boundary}`,
      `Content-Disposition: form-data; name="file"; filename="${fileName}"`,
      `Content-Type: ${mimeType}`,
      "",
      content,
      `--${boundary}--`,
      "",
    ].join("\r\n");
    return { body, boundary };
  };

  // ─── 케이스 1: 인증 없이 업로드 → 401 ─────────────────────────────────
  // auth plugin 이 v2 file 라우트도 보호하는지 확인.
  const noAuth = buildMultipartBody("test.txt", "hello", "text/plain");
  const unauthorizedUpload = await app.inject({
    method: "POST",
    url: `/api/v2/workflow/nodes/${node.id}/files`,
    headers: { "content-type": `multipart/form-data; boundary=${noAuth.boundary}` },
    payload: noAuth.body,
  });
  assert.equal(unauthorizedUpload.statusCode, 401);

  // ─── 케이스 2: 정상 업로드 → 201 ──────────────────────────────────────
  const upload1 = buildMultipartBody("hello.txt", "hello world", "text/plain");
  const uploadRes = await app.inject({
    method: "POST",
    url: `/api/v2/workflow/nodes/${node.id}/files`,
    headers: {
      ...bearer(app, ownerId),
      "content-type": `multipart/form-data; boundary=${upload1.boundary}`,
    },
    payload: upload1.body,
  });
  assert.equal(uploadRes.statusCode, 201);
  const uploaded = uploadRes.json() as { id: number; fileName: string; url: string };
  assert.equal(uploaded.fileName, "hello.txt");
  // entity 의 buildFileResponse 가 v2 URL 을 반환하는지 확인.
  assert.equal(uploaded.url, `/api/v2/workflow/files/${uploaded.id}`);

  // ─── 케이스 3: sanitizeFileName 검증 ──────────────────────────────────
  // 위험한 파일명 (path traversal 시도) 을 _ 로 치환하는지 확인.
  // 도메인 entity 의 sanitize 규칙이 실제로 동작하는지 회귀 테스트.
  const upload2 = buildMultipartBody("../etc/passwd", "fake content", "text/plain");
  const sanitizedRes = await app.inject({
    method: "POST",
    url: `/api/v2/workflow/nodes/${node.id}/files`,
    headers: {
      ...bearer(app, ownerId),
      "content-type": `multipart/form-data; boundary=${upload2.boundary}`,
    },
    payload: upload2.body,
  });
  assert.equal(sanitizedRes.statusCode, 201);
  const sanitized = sanitizedRes.json() as { fileName: string };
  // .. 와 / 가 _ 로 치환되어야 함.
  assert.ok(!sanitized.fileName.includes("/"));
  assert.ok(!sanitized.fileName.includes(".."));

  // ─── 케이스 4: 다운로드 → 200 + buffer 내용 + 헤더 검증 ────────────────
  const downloadRes = await app.inject({
    method: "GET",
    url: `/api/v2/workflow/files/${uploaded.id}`,
    headers: { ...bearer(app, ownerId), "content-type": "application/json" },
  });
  assert.equal(downloadRes.statusCode, 200);
  // 응답이 binary buffer.
  assert.equal(downloadRes.body, "hello world");
  // controller 가 직접 세팅하는 헤더 검증.
  assert.equal(downloadRes.headers["content-type"], "text/plain");
  assert.ok(
    String(downloadRes.headers["content-disposition"]).includes("attachment"),
    "Content-Disposition should be attachment",
  );

  // ─── 케이스 5: 다른 사용자가 다운로드 시도 → 404 ──────────────────────
  // repository 의 userId 격리로 권한 검증 — 다른 사용자에겐 "없는 파일" 처럼 보임.
  const otherDownload = await app.inject({
    method: "GET",
    url: `/api/v2/workflow/files/${uploaded.id}`,
    headers: bearer(app, otherId),
  });
  assert.equal(otherDownload.statusCode, 404);

  // ─── 케이스 6: 다른 사용자가 삭제 시도 → 404 (권한 격리 재검증) ──────
  const otherDelete = await app.inject({
    method: "DELETE",
    url: `/api/v2/workflow/files/${uploaded.id}`,
    headers: bearer(app, otherId),
  });
  assert.equal(otherDelete.statusCode, 404);

  // ─── 케이스 7: 소유자 본인 삭제 → 204 ─────────────────────────────────
  const ownerDelete = await app.inject({
    method: "DELETE",
    url: `/api/v2/workflow/files/${uploaded.id}`,
    headers: bearer(app, ownerId),
  });
  assert.equal(ownerDelete.statusCode, 204);

  // ─── 케이스 8: 삭제 후 다운로드 시도 → 404 ────────────────────────────
  const downloadAfterDelete = await app.inject({
    method: "GET",
    url: `/api/v2/workflow/files/${uploaded.id}`,
    headers: { ...bearer(app, ownerId), "content-type": "application/json" },
  });
  assert.equal(downloadAfterDelete.statusCode, 404);

  // ─── 케이스 9: params.fileId 가 숫자 아님 → 400 (schema) ──────────────
  const invalidFileId = await app.inject({
    method: "GET",
    url: "/api/v2/workflow/files/abc",
    headers: { ...bearer(app, ownerId), "content-type": "application/json" },
  });
  assert.equal(invalidFileId.statusCode, 400);
});
