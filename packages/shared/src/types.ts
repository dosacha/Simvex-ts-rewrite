export type UserId = string;

export interface ModelSummary {
  id: number;
  title: string;
  modelUrl: string;
  description?: string;
  domainKey?: string;
  categoryKey?: string;
  slug?: string;
}

export interface PartContent {
  name?: string;
  description?: string;
  function?: string;
  material?: string;
  structure?: string;
  fileUrl?: string;
  integratedFile?: string;
  position?: { x: number; y: number; z: number };
  vector?: { x: number; y: number; z: number };
  explodeVector?: { x: number; y: number; z: number };
  raw?: Record<string, unknown>;
}

export interface PartSummary {
  id: number;
  meshName: string;
  content: PartContent;
}

export interface QuizItem {
  id: number;
  question: string;
  options: string[];
  answer?: number;
  explanation?: string;
  modelTitle?: string;
}

export interface MemoItem {
  id: number;
  title: string;
  content: string;
}

export interface AiAskRequest {
  modelId?: number;
  meshName?: string;
  question: string;
  notes?: string;
}

export interface AiAskResponse {
  answer: string;
  context: string;
  mode: "GLOBAL" | "PART";
  meta: Record<string, unknown>;
}

export interface AiHistoryItem {
  question: string;
  answer: string;
  timestamp: string;
}

export interface StudyCategory {
  categoryKey: string;
  title: string;
  models: ModelSummary[];
}

export interface StudyCatalog {
  domainKey: string;
  categories: StudyCategory[];
}

export interface StudyBundle {
  model: ModelSummary;
  parts: PartSummary[];
}
