import fs from "node:fs";
import path from "node:path";
import type { ModelSummary, PartSummary, StudyBundle, StudyCatalog } from "@simvex/shared";

interface RawAssetItem {
  id?: string;
  title?: string;
  desc?: string;
  position?: { x?: number; y?: number; z?: number };
  vector?: { x?: number; y?: number; z?: number };
  explodeVector?: { x?: number; y?: number; z?: number };
}

interface RawImportFile {
  integrated_file?: string;
  description?: string;
  assets?: RawAssetItem[];
}

interface CatalogStore {
  models: ModelSummary[];
  partsByModelId: Map<number, PartSummary[]>;
}

const DOMAIN_KEY = "engineering-dict";
const CATEGORY_KEY = "mechanics";
const IMPORT_DIR = path.resolve(process.cwd(), "..", "..", "..", "simvex-api-main", "src", "main", "resources", "import");
const ASSET_BASE = "/assets/3d";

let cachedStore: CatalogStore | null = null;

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
    .readdirSync(IMPORT_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^Data_.*\.json$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  const models: ModelSummary[] = [];
  const partsByModelId = new Map<number, PartSummary[]>();

  let modelId = 1;
  let partId = 1;

  for (const fileName of files) {
    const filePath = path.join(IMPORT_DIR, fileName);
    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8")) as RawImportFile;

    const title = deriveModelTitle(fileName, raw.integrated_file);
    const integratedFile = raw.integrated_file ?? `${title}.glb`;
    const folderName = title;
    const modelUrl = `${ASSET_BASE}/${folderName}/${integratedFile}`;

    const model: ModelSummary = {
      id: modelId,
      title,
      modelUrl,
      description: raw.description,
      domainKey: DOMAIN_KEY,
      categoryKey: CATEGORY_KEY,
      slug: slugify(title),
    };
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

    partsByModelId.set(modelId, parts);
    modelId += 1;
  }

  return { models, partsByModelId };
}

export function getCatalogStore(): CatalogStore {
  if (!cachedStore) {
    cachedStore = buildStore();
  }
  return cachedStore;
}

export function findModelById(id: number): ModelSummary | undefined {
  return getCatalogStore().models.find((model) => model.id === id);
}

export function findPartsByModelId(id: number): PartSummary[] {
  return getCatalogStore().partsByModelId.get(id) ?? [];
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
