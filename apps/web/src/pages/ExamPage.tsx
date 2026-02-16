import { useEffect, useMemo, useState } from "react";
import type { ExamQuestion, ExamResultResponse, ModelSummary } from "@simvex/shared";

export function ExamPage() {
  const [models, setModels] = useState<ModelSummary[]>([]);
  const [selectedModelIds, setSelectedModelIds] = useState<number[]>([]);

  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number | null>>({});

  const [result, setResult] = useState<ExamResultResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/models", { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as ModelSummary[];
      })
      .then((data) => {
        setModels(data);
        if (data.length > 0) setSelectedModelIds([data[0].id]);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "모델 목록 로딩 실패");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  const currentQuestion = questions[currentIndex] ?? null;
  const answeredCount = useMemo(
    () => Object.values(answers).filter((value) => value !== null && value !== undefined).length,
    [answers],
  );

  function toggleModel(modelId: number) {
    setSelectedModelIds((prev) => {
      if (prev.includes(modelId)) return prev.filter((id) => id !== modelId);
      return [...prev, modelId];
    });
  }

  async function startExam() {
    if (selectedModelIds.length === 0 || busy) return;

    setBusy(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/models/exam?modelIds=${selectedModelIds.join(",")}&count=20`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const list = (await res.json()) as ExamQuestion[];
      setQuestions(list);
      setCurrentIndex(0);
      setAnswers({});
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "시험 문제 로딩 실패");
    } finally {
      setBusy(false);
    }
  }

  async function submitExam() {
    if (questions.length === 0 || busy) return;

    setBusy(true);
    setError(null);

    try {
      const payload = {
        answers: questions.map((question) => ({
          questionId: question.id,
          selected: answers[question.id] ?? null,
        })),
      };

      const res = await fetch("/api/models/exam/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const graded = (await res.json()) as ExamResultResponse;
      setResult(graded);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "시험 제출 실패");
    } finally {
      setBusy(false);
    }
  }

  function resetExam() {
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers({});
    setResult(null);
    setError(null);
  }

  if (loading) return <div>시험 화면 로딩 중...</div>;

  return (
    <section>
      <h1>Exam</h1>
      {error ? <p>오류: {error}</p> : null}

      {questions.length === 0 && !result ? (
        <>
          <h2>문제에 포함할 모델 선택</h2>
          <ul>
            {models.map((model) => {
              const selected = selectedModelIds.includes(model.id);
              return (
                <li key={model.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleModel(model.id)}
                    />{" "}
                    {model.title}
                  </label>
                </li>
              );
            })}
          </ul>

          <button type="button" onClick={() => void startExam()} disabled={busy || selectedModelIds.length === 0}>
            시험 시작
          </button>
        </>
      ) : null}

      {questions.length > 0 && !result ? (
        <>
          <p>
            진행: {currentIndex + 1}/{questions.length} | 응답: {answeredCount}/{questions.length}
          </p>

          {currentQuestion ? (
            <div>
              <h2>
                문제 {currentIndex + 1} ({currentQuestion.modelTitle})
              </h2>
              <p>{currentQuestion.question}</p>

              <ul>
                {currentQuestion.options.map((option, index) => (
                  <li key={`${currentQuestion.id}-${index}`}>
                    <label>
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        checked={answers[currentQuestion.id] === index}
                        onChange={() =>
                          setAnswers((prev) => ({
                            ...prev,
                            [currentQuestion.id]: index,
                          }))
                        }
                      />{" "}
                      {option}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div>
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
            >
              이전
            </button>
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              disabled={currentIndex === questions.length - 1}
            >
              다음
            </button>
            <button type="button" onClick={() => void submitExam()} disabled={busy}>
              제출
            </button>
          </div>
        </>
      ) : null}

      {result ? (
        <>
          <h2>결과</h2>
          <p>
            점수: {result.score}점 ({result.correctCount}/{result.total})
          </p>

          <ul>
            {result.results.map((item) => (
              <li key={item.questionId}>
                Q{item.questionId} / {item.modelTitle} / {item.correct ? "정답" : "오답"} / 선택: {item.selected ?? "미응답"} /
                정답: {item.answer}
              </li>
            ))}
          </ul>

          <button type="button" onClick={resetExam}>
            다시 풀기
          </button>
        </>
      ) : null}
    </section>
  );
}
