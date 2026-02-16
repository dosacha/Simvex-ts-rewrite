import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { ModelSummary } from "@simvex/shared";

export function StudyPage() {
  const [models, setModels] = useState<ModelSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/models", { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as ModelSummary[];
      })
      .then((data) => setModels(data))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "모델 목록을 불러오지 못했습니다.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  if (loading) return <div>모델 목록을 불러오는 중입니다...</div>;
  if (error) return <div>오류: {error}</div>;

  return (
    <section>
      <h1>Study</h1>
      <p>학습할 모델을 선택하세요.</p>
      <ul>
        {models.map((model) => (
          <li key={model.id}>
            <Link to={`/learn?modelId=${model.id}`}>{model.title}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
