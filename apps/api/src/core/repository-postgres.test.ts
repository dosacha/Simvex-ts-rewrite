import test from "node:test";
import assert from "node:assert/strict";
import { Pool } from "pg";
import { createPostgresRepositories } from "./repository-postgres";
import { ensurePostgresSchema } from "./postgres-schema";

const databaseUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

test(
  "postgres repository: memo/ai/workflow CRUD가 동작함",
  { skip: !databaseUrl || "DATABASE_URL 또는 POSTGRES_URL이 없어 skip 함." },
  async () => {
    const pool = new Pool({ connectionString: databaseUrl, allowExitOnIdle: true });
    await ensurePostgresSchema(pool);
    await pool.query("DELETE FROM workflow_files");
    await pool.query("DELETE FROM workflow_connections");
    await pool.query("DELETE FROM workflow_nodes");
    await pool.query("DELETE FROM ai_histories");
    await pool.query("DELETE FROM memos");
    await pool.end();

    const repos = createPostgresRepositories({ databaseUrl: databaseUrl! });

    const memo = await repos.memo.create("pg-user", 55, { title: "pg-title", content: "pg-content" });
    const list = await repos.memo.listByModel("pg-user", 55);
    assert.equal(list.length, 1);
    assert.equal(list[0]?.id, memo.id);

    const updated = await repos.memo.update("pg-user", memo.id, { title: "u-title", content: "u-content" });
    assert.ok(updated);
    assert.equal(updated.title, "u-title");

    await repos.aiHistory.append("pg-user", 55, { question: "q", answer: "a" });
    const history = await repos.aiHistory.listByModel("pg-user", 55);
    assert.equal(history.length, 1);
    assert.equal(history[0]?.question, "q");

    const nodeA = await repos.workflow.createNode("pg-user", { title: "A", content: "a", x: 1, y: 2 });
    const nodeB = await repos.workflow.createNode("pg-user", { title: "B", content: "b", x: 3, y: 4 });
    const conn = await repos.workflow.createConnection("pg-user", {
      from: nodeA.id,
      to: nodeB.id,
      fromAnchor: "right",
      toAnchor: "left",
    });
    assert.ok(conn);

    const file = await repos.workflow.addFileToNode("pg-user", nodeA.id, {
      fileName: "pg.txt",
      contentType: "text/plain",
      buffer: Buffer.from("hello-pg", "utf-8"),
    });
    assert.ok(file);

    const wf = await repos.workflow.list("pg-user");
    assert.equal(wf.nodes.length, 2);
    assert.equal(wf.connections.length, 1);
    assert.equal(wf.nodes[0]?.files.length, 1);

    const fileFound = await repos.workflow.findFile("pg-user", file.id);
    assert.ok(fileFound);
    assert.equal(fileFound.buffer.toString("utf-8"), "hello-pg");
  },
);
