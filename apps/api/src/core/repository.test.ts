import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRepositories } from "./repository";

function createStateFilePath(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "simvex-repository-"));
  return path.join(dir, "state.json");
}

test("repository file mode: memo/ai/workflow state is restored after re-create", () => {
  const filePath = createStateFilePath();

  const repos1 = createRepositories({ filePath });
  const memo = repos1.memo.create("user-a", 101, { title: "title-1", content: "content-1" });
  repos1.aiHistory.append("user-a", 101, { question: "Q1", answer: "A1" });

  const node1 = repos1.workflow.createNode("user-a", { title: "n1", content: "c1", x: 10, y: 20 });
  const node2 = repos1.workflow.createNode("user-a", { title: "n2", content: "c2", x: 30, y: 40 });
  repos1.workflow.createConnection("user-a", { from: node1.id, to: node2.id, fromAnchor: "right", toAnchor: "left" });
  const file = repos1.workflow.addFileToNode("user-a", node1.id, {
    fileName: "note.txt",
    contentType: "text/plain",
    buffer: Buffer.from("hello repository", "utf-8"),
  });
  assert.ok(file);

  const repos2 = createRepositories({ filePath });

  const memos = repos2.memo.listByModel("user-a", 101);
  assert.equal(memos.length, 1);
  assert.equal(memos[0]?.id, memo.id);
  assert.equal(memos[0]?.title, "title-1");
  assert.equal(memos[0]?.content, "content-1");

  const history = repos2.aiHistory.listByModel("user-a", 101);
  assert.equal(history.length, 1);
  assert.equal(history[0]?.question, "Q1");
  assert.equal(history[0]?.answer, "A1");

  const workflow = repos2.workflow.list("user-a");
  assert.equal(workflow.nodes.length, 2);
  assert.equal(workflow.connections.length, 1);
  assert.equal(workflow.nodes[0]?.files.length, 1);

  const persistedFileId = workflow.nodes[0]?.files[0]?.id;
  assert.ok(typeof persistedFileId === "number");
  const restoredFile = repos2.workflow.findFile("user-a", persistedFileId);
  assert.ok(restoredFile);
  assert.equal(restoredFile.fileName, "note.txt");
  assert.equal(restoredFile.contentType, "text/plain");
  assert.equal(restoredFile.buffer.toString("utf-8"), "hello repository");
});
