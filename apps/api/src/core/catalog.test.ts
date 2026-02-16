import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  buildStudyCatalog,
  findQuizzesByModelId,
  generateExamQuestions,
  gradeExam,
  setCatalogImportDir,
} from "./catalog";

function createImportFixture(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "simvex-catalog-"));
  const filePath = path.join(root, "Data_TEST.json");
  fs.writeFileSync(
    filePath,
    JSON.stringify(
      {
        integrated_file: "ENGINE_BLOCK.glb",
        description: "fixture model",
        assets: [
          {
            id: "p-1",
            title: "Piston",
            desc: "A moving part",
            position: { x: 1, y: 2, z: 3 },
            vector: { x: 0, y: 1, z: 0 },
            explodeVector: { x: 0, y: 0, z: 1 },
          },
        ],
        quizzes: [
          {
            q: "Which part converts pressure to motion?",
            opts: ["Piston", "Spark plug", "Valve", "Carburetor"],
            ans: 0,
          },
          {
            q: "Which part ignites fuel?",
            opts: ["Crankshaft", "Spark plug", "Camshaft", "Flywheel"],
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

test("buildStudyCatalog: fixture import file is parsed into catalog", () => {
  const fixtureDir = createImportFixture();
  setCatalogImportDir(fixtureDir);

  const catalog = buildStudyCatalog("engineering-dict");
  assert.equal(catalog.categories.length, 1);
  assert.equal(catalog.categories[0].models.length, 1);
  assert.equal(catalog.categories[0].models[0].title, "Engine_Block");
});

test("generateExamQuestions: answer field is not exposed", () => {
  const fixtureDir = createImportFixture();
  setCatalogImportDir(fixtureDir);

  const quizzes = findQuizzesByModelId(1);
  assert.equal(quizzes.length, 2);

  const questions = generateExamQuestions([1], 2);
  assert.equal(questions.length, 2);
  for (const question of questions) {
    assert.ok("question" in question);
    assert.ok(!("answer" in question));
  }
});

test("gradeExam: selected answers are graded correctly", () => {
  const fixtureDir = createImportFixture();
  setCatalogImportDir(fixtureDir);

  const quizzes = findQuizzesByModelId(1);
  const first = quizzes[0];
  const second = quizzes[1];
  assert.ok(first);
  assert.ok(second);

  const result = gradeExam([
    { questionId: first.id, selected: 0 },
    { questionId: second.id, selected: 2 },
    { questionId: 99999, selected: 0 },
  ]);

  assert.equal(result.total, 2);
  assert.equal(result.correctCount, 1);
  assert.equal(result.results.length, 2);
});
