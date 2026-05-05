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
  const category = catalog.categories[0];
  assert.ok(category);
  assert.equal(category.models.length, 1);
  const firstModel = category.models[0];
  assert.ok(firstModel);
  assert.equal(firstModel.title, "Engine_Block");
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

test("model_id 안정성: 명시된 model_id 는 파일 정렬 위치와 무관하게 부여됨 (drift 방지)", () => {
  // 회귀 케이스 — 이전엔 파일 정렬 순서가 곧 modelId 였다. 새 모델 한 개를 알파벳
  // 앞쪽에 추가하면 기존 ID 가 한 칸씩 밀려서 memos.model_id / ai_histories.model_id
  // 가 다른 모델을 가리키는 데이터 손상이 일어났다.
  // 명시적 model_id 도입 후로는 파일 위치와 ID 가 분리되어 있어야 한다.
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "simvex-catalog-drift-"));

  // ZZZ_Last 가 알파벳 정렬상 마지막이지만 model_id 7 명시
  fs.writeFileSync(
    path.join(root, "Data_ZZZ_Last.json"),
    JSON.stringify({
      model_id: 7,
      integrated_file: "ZZZ.glb",
      description: "last alphabetically, but explicit id 7",
      assets: [],
      quizzes: [],
    }),
    "utf-8",
  );

  // AAA_First 가 알파벳 정렬상 먼저지만 model_id 42 명시
  fs.writeFileSync(
    path.join(root, "Data_AAA_First.json"),
    JSON.stringify({
      model_id: 42,
      integrated_file: "AAA.glb",
      description: "first alphabetically, but explicit id 42",
      assets: [],
      quizzes: [],
    }),
    "utf-8",
  );

  setCatalogImportDir(root);

  const catalog = buildStudyCatalog("engineering-dict");
  const category = catalog.categories[0];
  assert.ok(category);
  const ids = category.models.map((m) => m.id).sort((a, b) => a - b);

  // 파일 정렬 순서대로라면 1, 2 가 됐겠지만 명시 ID 7, 42 가 그대로 살아있어야 함.
  assert.deepEqual(ids, [7, 42], "명시된 model_id 가 파일 정렬과 무관하게 보존되어야 함");
});

test("model_id 중복: 둘 이상의 import 파일이 같은 model_id 를 선언하면 빌드 실패", () => {
  // 운영 규칙: model_id 는 절대 재사용 금지. 같은 ID 가 두 파일에 선언되면
  // memos.model_id 가 어느 모델을 가리키는지 모호해지므로 부트 시점에 throw.
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "simvex-catalog-dup-"));

  fs.writeFileSync(
    path.join(root, "Data_A.json"),
    JSON.stringify({ model_id: 5, integrated_file: "A.glb", assets: [], quizzes: [] }),
    "utf-8",
  );
  fs.writeFileSync(
    path.join(root, "Data_B.json"),
    JSON.stringify({ model_id: 5, integrated_file: "B.glb", assets: [], quizzes: [] }),
    "utf-8",
  );

  setCatalogImportDir(root);

  assert.throws(
    () => buildStudyCatalog("engineering-dict"),
    /model_id 중복/,
    "같은 model_id 두 번 선언 시 명시적으로 throw 되어야 함",
  );
});
