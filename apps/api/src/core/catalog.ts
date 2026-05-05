import fs from "node:fs";
import path from "node:path";
import type {
  ExamQuestion,
  ExamResultItem,
  ExamSubmitItem,
  ModelSummary,
  PartSummary,
  QuizItem,
  StudyBundle,
  StudyCatalog,
} from "@simvex/shared";

interface RawAssetItem {
  id?: string;
  title?: string;
  desc?: string;
  position?: { x?: number; y?: number; z?: number };
  vector?: { x?: number; y?: number; z?: number };
  explodeVector?: { x?: number; y?: number; z?: number };
}

interface RawQuizItem {
  q?: string;
  question?: string;
  opts?: string[];
  options?: string[];
  ans?: number;
  answer?: number;
  explanation?: string;
}

interface RawImportFile {
  /**
   * 명시적 model_id — 이 카탈로그가 DB 에 박히는 안정 키.
   *
   * 의도: 파일 정렬 순서 기반 ID 부여는 새 모델 한 개만 추가해도 기존 ID 가 한 칸씩
   * 밀려 memos.model_id / ai_histories.model_id 가 다른 모델을 가리키게 된다.
   * 이를 막기 위해 import 파일이 자신의 ID 를 명시적으로 선언하도록 한다.
   *
   * 운영 규칙:
   *   - 신규 import 파일은 반드시 양의 정수 model_id 를 명시.
   *   - 한 번 부여한 ID 는 절대 다른 모델로 재사용하지 않는다.
   *   - 미명시 시 buildStore 가 fallback 으로 파일 정렬 순서 ID 를 부여하지만 warning 을 출력.
   */
  model_id?: number;
  integrated_file?: string;
  description?: string;
  assets?: RawAssetItem[];
  quizzes?: RawQuizItem[];
}

interface CatalogStore {
  models: ModelSummary[];
  partsByModelId: Map<number, PartSummary[]>;
  quizzesByModelId: Map<number, QuizItem[]>;
  answerByQuizId: Map<number, number>;
}

export const DEFAULT_DOMAIN_KEY = "engineering-dict";
const CATEGORY_KEY = "mechanics";
const DEFAULT_IMPORT_DIR = path.resolve(
  process.cwd(),
  "apps",
  "api",
  "data",
  "import",
);
const ASSET_BASE = "/assets/3d";

let cachedStore: CatalogStore | null = null;
let importDir = process.env.SIMVEX_IMPORT_DIR ? path.resolve(process.env.SIMVEX_IMPORT_DIR) : DEFAULT_IMPORT_DIR;

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toTitleCase(value: string): string {
  const lower = value.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function deriveModelTitle(fileName: string, integratedFile?: string): string {
  const rawFromFile = fileName.replace(/^Data_/, "").replace(/\.json$/i, "");
  const rawFromIntegrated = (integratedFile ?? "").replace(/\.glb$/i, "");

  if (rawFromIntegrated) {
    if (/^[A-Z0-9_]+$/.test(rawFromIntegrated)) {
      return rawFromIntegrated
        .split("_")
        .filter(Boolean)
        .map(toTitleCase)
        .join("_");
    }
    return rawFromIntegrated;
  }

  return rawFromFile;
}

function asNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function buildStore(): CatalogStore {
  if (!fs.existsSync(importDir)) {
    console.warn(`[catalog] importDir not found: ${importDir}. Returning empty store.`);
    return {
      models: [],
      partsByModelId: new Map(),
      quizzesByModelId: new Map(),
      answerByQuizId: new Map(),
    };
  }
  const files = fs
    .readdirSync(importDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^Data_.*\.json$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  const models: ModelSummary[] = [];
  const partsByModelId = new Map<number, PartSummary[]>();
  const quizzesByModelId = new Map<number, QuizItem[]>();
  const answerByQuizId = new Map<number, number>();

  // partId / quizId 는 catalog 내부에서만 쓰이고 DB 에 박히지 않는다.
  // 따라서 파일 추가/삭제로 인한 drift 가 같은 시험 세션 안에서만 영향을 주고,
  // 영구 데이터 정합성에는 영향을 주지 않는다 (memos / ai_histories 는 model_id 만 참조).
  let partId = 1;
  let quizId = 1;

  // model_id 가 미명시인 파일에 fallback 부여할 때 사용하는 카운터.
  // 명시된 ID 와 충돌하지 않도록 max(명시된 ID) + 1 부터 시작 — 아래 1차 패스에서 계산.
  const explicitIds = new Set<number>();
  for (const fileName of files) {
    const filePath = path.join(importDir, fileName);
    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8")) as RawImportFile;
    if (typeof raw.model_id === "number" && Number.isInteger(raw.model_id) && raw.model_id > 0) {
      if (explicitIds.has(raw.model_id)) {
        throw new Error(
          `[catalog] model_id 중복: ${raw.model_id} 가 둘 이상의 import 파일에 선언됨 (${fileName} 포함). 운영 규칙: ID 는 절대 재사용 금지.`,
        );
      }
      explicitIds.add(raw.model_id);
    }
  }
  let fallbackModelId = explicitIds.size > 0 ? Math.max(...explicitIds) + 1 : 1;

  for (const fileName of files) {
    const filePath = path.join(importDir, fileName);
    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8")) as RawImportFile;

    // 1. 명시된 model_id 우선 (운영 규칙: 신규 import 파일은 반드시 명시).
    // 2. 미명시 시 fallback — 기존 명시 ID 와 충돌 없는 다음 정수.
    //    경고 출력으로 운영자가 누락을 인지할 수 있게 함.
    let modelId: number;
    if (typeof raw.model_id === "number" && Number.isInteger(raw.model_id) && raw.model_id > 0) {
      modelId = raw.model_id;
    } else {
      modelId = fallbackModelId++;
      console.warn(
        `[catalog] ${fileName}: model_id 미명시. fallback ID ${modelId} 부여. ` +
          "운영 규칙 위반이며, 파일 추가/삭제 시 drift 위험. 명시적 model_id 추가 필요.",
      );
    }

    const title = deriveModelTitle(fileName, raw.integrated_file);
    const integratedFile = raw.integrated_file ?? `${title}.glb`;
    const folderName = title;
    const modelUrl = `${ASSET_BASE}/${folderName}/${integratedFile}`;

    const model: ModelSummary = {
      id: modelId,
      title,
      modelUrl,
      domainKey: DEFAULT_DOMAIN_KEY,
      categoryKey: CATEGORY_KEY,
      slug: slugify(title),
    };
    if (raw.description !== undefined) model.description = raw.description;
    models.push(model);

    const parts: PartSummary[] = (raw.assets ?? []).map((asset) => {
      const meshName = asset.title || asset.id || `part-${partId}`;
      const position = asset.position ?? {};
      const vector = asset.vector ?? {};
      const explodeVector = asset.explodeVector ?? {};

      const part: PartSummary = {
        id: partId++,
        meshName,
        content: {
          name: meshName,
          description: asset.desc ?? "",
          fileUrl: modelUrl,
          integratedFile,
          position: {
            x: asNumber(position.x),
            y: asNumber(position.y),
            z: asNumber(position.z),
          },
          vector: {
            x: asNumber(vector.x),
            y: asNumber(vector.y),
            z: asNumber(vector.z),
          },
          explodeVector: {
            x: asNumber(explodeVector.x),
            y: asNumber(explodeVector.y),
            z: asNumber(explodeVector.z),
          },
          raw: {
            id: asset.id ?? meshName,
            title: asset.title ?? meshName,
            desc: asset.desc ?? "",
          },
        },
      };
      return part;
    });

    const quizzes: QuizItem[] = (raw.quizzes ?? [])
      .map((item) => {
        const question = item.q ?? item.question ?? "";
        const options = item.opts ?? item.options ?? [];
        const answer = asNumber(item.ans ?? item.answer);

        if (!question.trim() || !Array.isArray(options) || options.length < 2) return null;

        const quiz: QuizItem = {
          id: quizId++,
          question,
          options,
          modelTitle: title,
          modelId,
        };
        if (item.explanation !== undefined) quiz.explanation = item.explanation;

        answerByQuizId.set(quiz.id, answer);
        return quiz;
      })
      .filter((item): item is QuizItem => item !== null);

    partsByModelId.set(modelId, parts);
    quizzesByModelId.set(modelId, quizzes);
    // modelId 는 파일별 명시 또는 fallback 으로 결정되므로 loop 안에서 ++ 하지 않는다.
  }

  return { models, partsByModelId, quizzesByModelId, answerByQuizId };
}

export function getCatalogStore(): CatalogStore {
  if (!cachedStore) {
    cachedStore = buildStore();
  }
  return cachedStore;
}

export function setCatalogImportDir(nextImportDir: string): void {
  importDir = path.resolve(nextImportDir);
  cachedStore = null;
}

export function findModelById(id: number): ModelSummary | undefined {
  return getCatalogStore().models.find((model) => model.id === id);
}

export function findPartsByModelId(id: number): PartSummary[] {
  return getCatalogStore().partsByModelId.get(id) ?? [];
}

export function findQuizzesByModelId(id: number): QuizItem[] {
  return getCatalogStore().quizzesByModelId.get(id) ?? [];
}

/**
 * Fisher-Yates shuffle.
 *
 * 이전 구현은 sort(() => Math.random() - 0.5) 였으나 V8 의 timsort 비교 함수가
 * 비대칭이면 분포가 균등하지 않다 (앞쪽 요소가 더 자주 앞에 남는 편향).
 * 시험 출제 무작위성에 직접 영향을 주는 자리라 Fisher-Yates 로 교체.
 *
 * O(n) 시간, in-place 가 아닌 입력 보존 (caller 가 원본을 그대로 쓸 수 있도록).
 *
 * 구현 노트: noUncheckedIndexedAccess (tsconfig.base.json) 때문에 배열 인덱스
 * 접근이 T | undefined 로 추론된다. i 와 j 가 [0, length) 범위라는 건 loop
 * 조건이 보장하지만 컴파일러는 이를 추론 못 하므로 swap 자리에 non-null
 * assertion 을 명시.
 */
function fisherYatesShuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = result[i]!;
    result[i] = result[j]!;
    result[j] = tmp;
  }
  return result;
}

export function generateExamQuestions(modelIds: number[], count = 20): ExamQuestion[] {
  const questions = modelIds.flatMap((modelId) => findQuizzesByModelId(modelId));
  const shuffled = fisherYatesShuffle(questions).slice(0, count);

  return shuffled.map((item) => ({
    id: item.id,
    question: item.question,
    options: item.options,
    modelId: item.modelId ?? 0,
    modelTitle: item.modelTitle ?? "Unknown",
  }));
}

export function gradeExam(answers: ExamSubmitItem[]): { correctCount: number; total: number; results: ExamResultItem[] } {
  const answerMap = getCatalogStore().answerByQuizId;
  const quizMap = new Map<number, QuizItem>();
  for (const quizzes of getCatalogStore().quizzesByModelId.values()) {
    for (const quiz of quizzes) quizMap.set(quiz.id, quiz);
  }

  const results: ExamResultItem[] = answers
    .map((item) => {
      const answer = answerMap.get(item.questionId);
      const quiz = quizMap.get(item.questionId);
      if (answer === undefined || !quiz) return null;

      return {
        questionId: item.questionId,
        selected: item.selected,
        answer,
        correct: item.selected === answer,
        modelId: quiz.modelId ?? 0,
        modelTitle: quiz.modelTitle ?? "Unknown",
      };
    })
    .filter((item): item is ExamResultItem => item !== null);

  const correctCount = results.filter((item) => item.correct).length;
  return {
    correctCount,
    total: results.length,
    results,
  };
}

export function buildStudyCatalog(domainKey: string): StudyCatalog {
  const store = getCatalogStore();
  const models = store.models.filter((model) => model.domainKey === domainKey);
  return {
    domainKey,
    categories: [
      {
        categoryKey: CATEGORY_KEY,
        title: CATEGORY_KEY,
        models,
      },
    ],
  };
}

export function buildStudyBundle(domainKey: string, categoryKey: string, slug: string): StudyBundle | null {
  const model = getCatalogStore().models.find(
    (item) => item.domainKey === domainKey && item.categoryKey === categoryKey && item.slug === slug,
  );

  if (!model) return null;

  return {
    model,
    parts: findPartsByModelId(model.id),
  };
}