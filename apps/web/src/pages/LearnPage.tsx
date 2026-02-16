import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { AiAskResponse, MemoItem, ModelSummary, PartSummary } from "@simvex/shared";
import { getUserId } from "../app/user";

interface ChatMessage {
  role: "user" | "ai";
  text: string;
}

export function LearnPage() {
  const [searchParams] = useSearchParams();
  const modelId = Number(searchParams.get("modelId"));

  const [models, setModels] = useState<ModelSummary[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelSummary | null>(null);
  const [parts, setParts] = useState<PartSummary[]>([]);
  const [selectedPartName, setSelectedPartName] = useState<string | null>(null);

  const [memos, setMemos] = useState<MemoItem[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadModels() {
      setLoading(true);
      setError(null);

      try {
        const headers = { "X-User-ID": getUserId() };

        const modelRes = await fetch("/api/models", { signal: controller.signal, headers });
        if (!modelRes.ok) throw new Error(`HTTP ${modelRes.status}`);

        const modelList = (await modelRes.json()) as ModelSummary[];
        setModels(modelList);

        const target = modelList.find((item) => item.id === modelId) ?? modelList[0] ?? null;
        setSelectedModel(target);

        if (!target) {
          setParts([]);
          setMemos([]);
          return;
        }

        const [partRes, memoRes, historyRes] = await Promise.all([
          fetch(`/api/models/${target.id}/parts`, { signal: controller.signal, headers }),
          fetch(`/api/models/${target.id}/memos`, { signal: controller.signal, headers }),
          fetch(`/api/ai/history/${target.id}`, { signal: controller.signal, headers }),
        ]);

        if (!partRes.ok) throw new Error(`HTTP ${partRes.status}`);
        if (!memoRes.ok) throw new Error(`HTTP ${memoRes.status}`);
        if (!historyRes.ok) throw new Error(`HTTP ${historyRes.status}`);

        const [partList, memoList, history] = await Promise.all([
          partRes.json() as Promise<PartSummary[]>,
          memoRes.json() as Promise<MemoItem[]>,
          historyRes.json() as Promise<Array<{ question: string; answer: string }>>,
        ]);

        setParts(partList);
        setSelectedPartName(partList[0]?.meshName ?? null);
        setMemos(memoList);
        setChatMessages(
          history.flatMap((item) => [
            { role: "user" as const, text: item.question },
            { role: "ai" as const, text: item.answer },
          ]),
        );
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "학습 데이터를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }

    void loadModels();
    return () => controller.abort();
  }, [modelId]);

  const selectedPart = useMemo(
    () => parts.find((part) => part.meshName === selectedPartName) ?? null,
    [parts, selectedPartName],
  );

  const modelTitle = useMemo(() => selectedModel?.title ?? "모델 없음", [selectedModel]);

  async function addMemo() {
    if (!selectedModel) return;

    const res = await fetch(`/api/models/${selectedModel.id}/memos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-ID": getUserId(),
      },
      body: JSON.stringify({ title: "", content: "" }),
    });

    if (!res.ok) return;
    const created = (await res.json()) as MemoItem;
    setMemos((prev) => [...prev, created]);
  }

  async function saveMemo(memo: MemoItem) {
    const res = await fetch(`/api/memos/${memo.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-User-ID": getUserId(),
      },
      body: JSON.stringify({ title: memo.title, content: memo.content }),
    });

    if (!res.ok) return;
    const updated = (await res.json()) as MemoItem;
    setMemos((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  }

  async function removeMemo(memoId: number) {
    const res = await fetch(`/api/memos/${memoId}`, {
      method: "DELETE",
      headers: { "X-User-ID": getUserId() },
    });

    if (!res.ok) return;
    setMemos((prev) => prev.filter((memo) => memo.id !== memoId));
  }

  async function askAi() {
    if (!selectedModel || !question.trim() || asking) return;

    const currentQuestion = question.trim();
    setQuestion("");
    setAsking(true);
    setChatMessages((prev) => [...prev, { role: "user", text: currentQuestion }]);

    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": getUserId(),
        },
        body: JSON.stringify({
          modelId: selectedModel.id,
          meshName: selectedPart?.meshName,
          question: currentQuestion,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as AiAskResponse;
      setChatMessages((prev) => [...prev, { role: "ai", text: data.answer }]);
    } catch (err: unknown) {
      const text = err instanceof Error ? err.message : "AI 응답을 받지 못했습니다.";
      setChatMessages((prev) => [...prev, { role: "ai", text }]);
    } finally {
      setAsking(false);
    }
  }

  if (loading) return <div>학습 데이터를 불러오는 중입니다...</div>;
  if (error) return <div>오류: {error}</div>;

  return (
    <section>
      <h1>Learn</h1>
      <p>
        현재 모델: <strong>{modelTitle}</strong>
      </p>

      <h2>부품 목록</h2>
      {parts.length === 0 ? (
        <p>등록된 부품이 없습니다.</p>
      ) : (
        <ul>
          {parts.map((part) => (
            <li key={part.id}>
              <button type="button" onClick={() => setSelectedPartName(part.meshName)}>
                {part.meshName}
              </button>
              {part.content.description ? ` - ${part.content.description}` : ""}
            </li>
          ))}
        </ul>
      )}

      <h2>AI 질문</h2>
      <p>선택 부품: {selectedPart?.meshName ?? "없음"}</p>
      <input
        type="text"
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        placeholder="질문을 입력하세요"
        onKeyDown={(event) => {
          if (event.key === "Enter") void askAi();
        }}
      />
      <button type="button" onClick={() => void askAi()} disabled={asking}>
        질문하기
      </button>
      <ul>
        {chatMessages.map((message, index) => (
          <li key={`${message.role}-${index}`}>
            [{message.role}] {message.text}
          </li>
        ))}
      </ul>

      <h2>메모</h2>
      <button type="button" onClick={() => void addMemo()}>
        메모 추가
      </button>
      <ul>
        {memos.map((memo) => (
          <li key={memo.id}>
            <input
              value={memo.title}
              placeholder="제목"
              onChange={(event) => {
                const title = event.target.value;
                setMemos((prev) => prev.map((item) => (item.id === memo.id ? { ...item, title } : item)));
              }}
              onBlur={() => void saveMemo(memo)}
            />
            <br />
            <textarea
              value={memo.content}
              placeholder="내용"
              onChange={(event) => {
                const content = event.target.value;
                setMemos((prev) => prev.map((item) => (item.id === memo.id ? { ...item, content } : item)));
              }}
              onBlur={() => void saveMemo(memo)}
            />
            <br />
            <button type="button" onClick={() => void removeMemo(memo.id)}>
              삭제
            </button>
          </li>
        ))}
      </ul>

      <p>
        <Link to="/study">모델 다시 선택</Link>
      </p>
      <p>
        사용 가능한 모델 수: {models.length}
      </p>
    </section>
  );
}
