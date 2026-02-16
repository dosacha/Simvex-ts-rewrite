import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { StudyCatalog } from "@simvex/shared";

const DEFAULT_DOMAIN_KEY = "engineering-dict";

export function StudyPage() {
  const [catalog, setCatalog] = useState<StudyCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/study/catalog?domain=${DEFAULT_DOMAIN_KEY}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as StudyCatalog;
      })
      .then((data) => setCatalog(data))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "학습 카탈로그를 불러오지 못했습니다.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  if (loading) return <div>학습 카탈로그를 불러오는 중입니다...</div>;
  if (error) return <div>오류: {error}</div>;

  return (
    <section>
      <h1>Study</h1>
      <p>도메인: {catalog?.domainKey ?? DEFAULT_DOMAIN_KEY}</p>
      <p>학습할 카테고리와 모델을 선택함.</p>
      {catalog && catalog.categories.length > 0 ? (
        catalog.categories.map((category) => (
          <section key={category.categoryKey}>
            <h2>{category.title}</h2>
            {category.models.length === 0 ? (
              <p>등록된 모델이 없음.</p>
            ) : (
              <ul>
                {category.models.map((model) => (
                  <li key={model.id}>
                    <Link to={`/learn?modelId=${model.id}`}>{model.title}</Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))
      ) : (
        <p>표시할 카테고리가 없음.</p>
      )}
    </section>
  );
}
