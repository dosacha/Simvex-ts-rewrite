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
  "..",
  "..",
  "..",
  "simvex-api-main",
  "src",
  "main",
  "resources",
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
  const files = fs
    .readdirSync(importDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^Data_.*\.json$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  const models: ModelSummary[] = [];
  const partsByModelId = new Map<number, PartSummary[]>();
  const quizzesByModelId = new Map<number, QuizItem[]>();
  const answerByQuizId = new Map<number, number>();

  let modelId = 1;
  let partId = 1;
  let quizId = 1;

  for (const fileName of files) {
    const filePath = path.join(importDir, fileName);
    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8")) as RawImportFile;

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
    modelId += 1;
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

export function generateExamQuestions(modelIds: number[], count = 20): ExamQuestion[] {
  const questions = modelIds.flatMap((modelId) => findQuizzesByModelId(modelId));
  const shuffled = [...questions].sort(() => Math.random() - 0.5).slice(0, count);

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
