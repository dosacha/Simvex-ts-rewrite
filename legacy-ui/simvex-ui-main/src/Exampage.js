import { useEffect, useMemo, useState } from "react";
import "./Shared.css";
import "./Exampage.css";

/**
 * 남은 시간을 분:초 형식으로 변환
 */
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

/**
 * 원형 점수 그래프 컴포넌트 (SVG)
 */
function ScoreCircle({ score }) {
  const radius = 60;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // 점수에 따른 색상 결정
  let color = "#ef4444"; // 빨강
  if (score >= 80) color = "#22c55e"; // 초록
  else if (score >= 50) color = "#eab308"; // 노랑

  return (
    <div className="score-circle-container">
      <svg height={radius * 2} width={radius * 2}>
        <circle
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={stroke}
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + " " + circumference}
          style={{ strokeDashoffset, transition: "stroke-dashoffset 1.5s ease-in-out" }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          transform={`rotate(-90 ${radius} ${radius})`}
        />
        <text
          x="50%"
          y="50%"
          dy="0.3em"
          textAnchor="middle"
          className="score-circle-text"
          fill="#fff"
        >
          {score}점
        </text>
      </svg>
    </div>
  );
}

export default function ExamPage({
  field,
  selectedModels = [],
  onHome,
  onStudy,
  onLab,
  onTest,
  onBack,
}) {
  const [activeNav, setActiveNav] = useState("Test");
  const navItems = ["Home", "Study", "CAD", "Lab", "Test"];

  const [examState, setExamState] = useState("start");
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(30 * 60);

  // DB에서 문제 가져오기
  const fetchQuestions = async () => {
    if (selectedModels.length === 0) return;
    setExamState("loading");

    try {
      const ids = selectedModels.map((m) => m.id).join(",");
      const res = await fetch(`/api/models/exam?modelIds=${ids}`);
      
      if (!res.ok) throw new Error("문제를 불러오는데 실패했습니다.");
      
      const data = await res.json();
      setQuestions(data);

      setExamState("inProgress");
      setCurrentQ(0);
      setUserAnswers({});
      setTimeLeft(30 * 60);
    } catch (err) {
      alert("오류: " + err.message);
      setExamState("start");
    }
  };

  useEffect(() => {
    if (examState !== "inProgress") return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [examState]);

  const handleNav = (item) => {
    if (item === "CAD") {
      alert("페이지 준비중입니다");
      return;
    }
    setActiveNav(item);
    if (item === "Home") onHome();
    if (item === "Study") onStudy();
    if (item === "Lab") onLab?.();
    if (item === "Test") onTest?.();
  };

  const startExam = () => fetchQuestions();
  
  const selectOption = (qIdx, optIdx) => {
    setUserAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const goToQuestion = (idx) => setCurrentQ(idx);
  const handleSubmit = () => setExamState("result");
  const retryExam = () => fetchQuestions();

  const correctCount = useMemo(() => {
    let cnt = 0;
    questions.forEach((q, i) => {
      if (userAnswers[i] === q.answer) cnt++;
    });
    return cnt;
  }, [questions, userAnswers]);

  const score = useMemo(() => {
    if (questions.length === 0) return 0;
    return Math.round((correctCount / questions.length) * 100);
  }, [correctCount, questions.length]);

  const modelAnalysis = useMemo(() => {
    if (!questions || questions.length === 0) return [];
    const analysis = {};
    questions.forEach((q, i) => {
      const title = q.modelTitle || "기타";
      if (!analysis[title]) analysis[title] = { correct: 0, total: 0 };
      analysis[title].total += 1;
      if (userAnswers[i] === q.answer) analysis[title].correct += 1;
    });

    return Object.entries(analysis)
      .map(([title, stats]) => ({
        title,
        correct: stats.correct,
        total: stats.total,
        percent: Math.round((stats.correct / stats.total) * 100)
      }))
      .sort((a, b) => a.percent - b.percent);
  }, [questions, userAnswers]);

  const weakModel = useMemo(() => {
    if (modelAnalysis.length === 0) return null;
    const worst = modelAnalysis[0];
    return worst.percent < 100 ? worst.title : null;
  }, [modelAnalysis]);

  // ─── 시작 화면 ───
  if (examState === "start" || examState === "loading") {
    return (
      <>
        <div className="noise-overlay" />
        <div className="ambient-glow glow-1" />
        <div className="ambient-glow glow-2" />
        <div className="page-wrapper">
          <nav className="nav">
            <div className="inner">
              <div className="nav-logo" onClick={onHome}><span className="nav-logo-text">SIMVEX</span></div>
              <div className="nav-links">
                {navItems.map((item) => (
                  <button key={item} className={`nav-link${activeNav === item ? " active" : ""}`} onClick={() => handleNav(item)}>{item}</button>
                ))}
              </div>
            </div>
          </nav>
          <section className="exam-body">
            <div className="inner">
              <div className="exam-start">
                <div className="exam-start-icon">
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <rect x="12" y="8" width="40" height="48" rx="4" fill="rgba(37,99,235,0.2)" stroke="#2563eb" strokeWidth="2" />
                    <line x1="20" y1="20" x2="44" y2="20" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                    <line x1="20" y1="28" x2="44" y2="28" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                    <line x1="20" y1="36" x2="36" y2="36" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="22" cy="44" r="2" fill="#2563eb" />
                    <circle cx="30" cy="44" r="2" fill="#2563eb" />
                    <circle cx="38" cy="44" r="2" fill="#2563eb" />
                  </svg>
                </div>
                <h2 className="exam-start-title">{field} 모의고사</h2>
                <div className="exam-selected-products">
                  <div className="exam-selected-label">선택된 모델</div>
                  <div className="exam-selected-list">
                    {selectedModels.map((m, i) => (<span key={i}>{m.title}{i < selectedModels.length - 1 ? ", " : ""}</span>))}
                  </div>
                </div>
                <div className="exam-start-info">
                  <div className="exam-info-item"><div className="exam-info-label">문제 수</div><div className="exam-info-value">20문제</div></div>
                  <div className="exam-info-item"><div className="exam-info-label">시험 시간</div><div className="exam-info-value">30분</div></div>
                </div>
                <p className="exam-start-desc">선택한 모델에 대한 종합 문제가 출제됩니다.<br />제한 시간 내에 최선을 다해 풀어보세요!</p>
                <button className="exam-start-btn" onClick={startExam} disabled={examState === "loading"}>
                  {examState === "loading" ? "문제 생성 중..." : "시험 시작"}
                </button>
                <button className="exam-back-btn" onClick={onBack} disabled={examState === "loading"}>모델 다시 선택</button>
              </div>
            </div>
          </section>
        </div>
      </>
    );
  }

  // ─── 시험 진행 화면 ───
  if (examState === "inProgress") {
    const q = questions[currentQ];
    if (!q) return null;
    const progress = ((currentQ + 1) / questions.length) * 100;
    const answeredCount = Object.keys(userAnswers).length;

    return (
      <>
        <div className="noise-overlay" />
        <div className="ambient-glow glow-1" />
        <div className="ambient-glow glow-2" />
        <div className="page-wrapper">
          <nav className="nav">
            <div className="inner">
              <div className="nav-logo" onClick={onHome}><span className="nav-logo-text">SIMVEX</span></div>
            </div>
          </nav>
          <section className="exam-body">
            <div className="inner">
              <div className="exam-progress">
                <div className="exam-header">
                  <div className="exam-progress-info">문제 {currentQ + 1} / {questions.length} (답변: {answeredCount})</div>
                  <div className="exam-timer">⏱️ {formatTime(timeLeft)}</div>
                </div>
                <div className="exam-progress-bar-bg"><div className="exam-progress-bar-fill" style={{ width: `${progress}%` }} /></div>
                <div className="exam-question-card">
                  <div className="exam-question-num">
                    문제 {currentQ + 1}
                    {q.modelTitle && <span style={{ fontSize: "0.8em", color: "#64748b", marginLeft: "10px", fontWeight: "normal" }}> | {q.modelTitle}</span>}
                  </div>
                  <div className="exam-question-text">{q.question}</div>
                  <div className="exam-options">
                    {q.options && q.options.map((opt, i) => (
                      <button key={i} className={`exam-option${userAnswers[currentQ] === i ? " selected" : ""}`} onClick={() => selectOption(currentQ, i)}>
                        <div className="exam-option-num">{i + 1}</div>
                        <div className="exam-option-text">{opt}</div>
                        {userAnswers[currentQ] === i && <div className="exam-option-check">✓</div>}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="exam-nav-btns">
                  <button className="exam-prev-btn" onClick={() => setCurrentQ((p) => Math.max(0, p - 1))} disabled={currentQ === 0}>◀ 이전</button>
                  {currentQ < questions.length - 1 ? (
                    <button className="exam-next-btn" onClick={() => setCurrentQ((p) => p + 1)}>다음 ▶</button>
                  ) : (
                    <button className="exam-submit-btn" onClick={handleSubmit}>제출하기</button>
                  )}
                </div>
                <div className="exam-question-nav">
                  {questions.map((_, i) => (
                    <button key={i} className={`exam-q-num${currentQ === i ? " active" : ""}${userAnswers[i] !== undefined ? " answered" : ""}`} onClick={() => goToQuestion(i)}>{i + 1}</button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </>
    );
  }

  // ─── 결과 화면 (대시보드형 리뉴얼) ───
  if (examState === "result") {
    let resultMsg = "";
    if (score >= 90) resultMsg = "완벽에 가까운 실력입니다!";
    else if (score >= 70) resultMsg = "준수한 성적입니다.";
    else if (score >= 50) resultMsg = "조금 더 노력이 필요해요.";
    else resultMsg = "기초부터 다시 복습해봅시다.";

    return (
      <>
        <div className="noise-overlay" />
        <div className="ambient-glow glow-1" />
        <div className="ambient-glow glow-2" />

        <div className="page-wrapper">
          <nav className="nav">
            <div className="inner">
              <div className="nav-logo" onClick={onHome}><span className="nav-logo-text">SIMVEX</span></div>
              <div className="nav-links">
                {navItems.map((item) => (
                  <button key={item} className={`nav-link${activeNav === item ? " active" : ""}`} onClick={() => handleNav(item)}>{item}</button>
                ))}
              </div>
            </div>
          </nav>

          <section className="exam-body">
            <div className="inner">
              <div className="result-dashboard-container">
                <h2 className="result-page-title">모의고사 분석 결과</h2>
                
                <div className="result-dashboard-grid">
                  {/* 왼쪽 카드: 종합 점수 요약 */}
                  <div className="result-card result-summary-card">
                    <div className="result-card-header">종합 성취도</div>
                    <div className="result-score-wrapper">
                      <ScoreCircle score={score} />
                      <div className="result-text-group">
                        <div className="result-grade-label">
                          {score >= 90 ? "Excellent" : score >= 70 ? "Good" : score >= 50 ? "Average" : "Poor"}
                        </div>
                        <p className="result-message">{resultMsg}</p>
                      </div>
                    </div>

                    <div className="result-stats-row">
                      <div className="stat-item">
                        <span className="stat-label">맞은 문제</span>
                        <span className="stat-value text-green">{correctCount}</span>
                      </div>
                      <div className="stat-divider"></div>
                      <div className="stat-item">
                        <span className="stat-label">총 문제</span>
                        <span className="stat-value">{questions.length}</span>
                      </div>
                    </div>

                    {weakModel && (
                      <div className="weakness-box">
                        <div className="weakness-icon">💡</div>
                        <div className="weakness-content">
                          <strong>{weakModel}</strong> 관련 학습이 부족합니다.<br/>
                          해당 파트의 개념을 다시 확인하세요.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 오른쪽 카드: 모델별 상세 분석 */}
                  <div className="result-card result-analysis-card">
                    <div className="result-card-header">모델별 상세 분석</div>
                    <div className="analysis-list-scroll">
                      {modelAnalysis.map((item, index) => (
                        <div key={index} className="analysis-item-row">
                          <div className="analysis-info">
                            <span className="analysis-model-name">{item.title}</span>
                            <span className="analysis-percent">{item.percent}%</span>
                          </div>
                          <div className="analysis-bar-track">
                            <div 
                              className="analysis-bar-fill" 
                              style={{ 
                                width: `${item.percent}%`,
                                backgroundColor: item.percent >= 80 ? '#22c55e' : item.percent >= 50 ? '#eab308' : '#ef4444'
                              }} 
                            />
                          </div>
                          <div className="analysis-fraction">{item.correct}/{item.total}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="result-action-bar">
                   <button className="action-btn retry" onClick={retryExam}>다시 풀기</button>
                   <button className="action-btn home" onClick={onHome}>홈으로 이동</button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </>
    );
  }

  return null;
}