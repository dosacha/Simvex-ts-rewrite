// Productlistpage.js
import { useEffect, useMemo, useState } from "react";
import "./Shared.css";
import "./Productlistpage.css";

/**
 * 분야(한글) -> 포함할 모델 title 매핑 (임시)
 */
const FIELD_TO_MODEL_TITLES = {
  "기계 공학": ["V4_Engine", "Robot_Arm", "Robot_Gripper", "Machine_Vice", "Suspension", "Leaf_Spring"],
  "전기 전자 공학": ["Leaf_Spring"],
  "항공 우주 공학": ["Drone"],
  "재료 과학": ["Suspension"],
  "화학 공학": [],
  "토목 공학": [],
};

/**
 *모델별 썸네일 SVG 아이콘
 */
const V4EngineIcon = () => (
  <svg viewBox="0 0 120 120" fill="none">
    <defs>
      <linearGradient id="engineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4a7a9a" />
        <stop offset="100%" stopColor="#7dd3e0" />
      </linearGradient>
    </defs>
    {/* 엔진 블록 */}
    <rect x="30" y="40" width="60" height="40" rx="4" fill="url(#engineGrad)" opacity="0.8" />
    {/* 실린더 4개 */}
    <rect x="35" y="25" width="10" height="20" rx="2" fill="#5abcd0" />
    <rect x="50" y="25" width="10" height="20" rx="2" fill="#5abcd0" />
    <rect x="65" y="25" width="10" height="20" rx="2" fill="#5abcd0" />
    <rect x="80" y="25" width="10" height="20" rx="2" fill="#5abcd0" />
    {/* 배기 파이프 */}
    <rect x="25" y="55" width="70" height="6" rx="3" fill="#3a6a8a" />
    {/* 크랭크샤프트 */}
    <circle cx="60" cy="90" r="8" fill="#2a5570" stroke="#7dd3e0" strokeWidth="2" />
  </svg>
);

const RobotArmIcon = () => (
  <svg viewBox="0 0 120 120" fill="none">
    <defs>
      <linearGradient id="armGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#60a5fa" />
        <stop offset="100%" stopColor="#3b82f6" />
      </linearGradient>
    </defs>
    {/* 베이스 */}
    <rect x="45" y="85" width="30" height="10" rx="2" fill="url(#armGrad)" />
    {/* 암 세그먼트 1 */}
    <rect x="55" y="55" width="10" height="35" rx="2" fill="#60a5fa" />
    {/* 조인트 */}
    <circle cx="60" cy="55" r="6" fill="#3b82f6" stroke="#1e40af" strokeWidth="2" />
    {/* 암 세그먼트 2 */}
    <rect x="60" y="35" width="25" height="8" rx="2" fill="#60a5fa" transform="rotate(-30 60 55)" />
    {/* 그리퍼 */}
    <path d="M 80 35 L 75 30 M 80 35 L 75 40" stroke="#1e40af" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const RobotGripperIcon = () => (
  <svg viewBox="0 0 120 120" fill="none">
    <defs>
      <linearGradient id="gripperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8b5cf6" />
        <stop offset="100%" stopColor="#a78bfa" />
      </linearGradient>
    </defs>
    {/* 그리퍼 몸체 */}
    <rect x="50" y="40" width="20" height="30" rx="3" fill="url(#gripperGrad)" />
    {/* 왼쪽 핑거 */}
    <rect x="35" y="70" width="8" height="25" rx="2" fill="#a78bfa" />
    <rect x="35" y="70" width="15" height="5" rx="1" fill="#8b5cf6" />
    {/* 오른쪽 핑거 */}
    <rect x="77" y="70" width="8" height="25" rx="2" fill="#a78bfa" />
    <rect x="70" y="70" width="15" height="5" rx="1" fill="#8b5cf6" />
    {/* 액추에이터 */}
    <circle cx="60" cy="35" r="8" fill="#6d28d9" stroke="#a78bfa" strokeWidth="2" />
  </svg>
);

const MachineViceIcon = () => (
  <svg viewBox="0 0 120 120" fill="none">
    <defs>
      <linearGradient id="viceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#64748b" />
        <stop offset="100%" stopColor="#94a3b8" />
      </linearGradient>
    </defs>
    {/* 베이스 */}
    <rect x="20" y="75" width="80" height="15" rx="2" fill="url(#viceGrad)" />
    {/* 고정 조 */}
    <rect x="30" y="45" width="12" height="35" rx="2" fill="#64748b" />
    {/* 이동 조 */}
    <rect x="78" y="45" width="12" height="35" rx="2" fill="#64748b" />
    {/* 스크류 */}
    <rect x="45" y="55" width="30" height="6" rx="3" fill="#475569" />
    <circle cx="75" cy="58" r="5" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
    {/* 핸들 */}
    <line x1="75" y1="58" x2="90" y2="58" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const SuspensionIcon = () => (
  <svg viewBox="0 0 120 120" fill="none">
    <defs>
      <linearGradient id="suspGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#fbbf24" />
      </linearGradient>
    </defs>
    {/* 스프링 */}
    <path d="M 60 30 Q 50 35, 60 40 Q 70 45, 60 50 Q 50 55, 60 60 Q 70 65, 60 70"
      stroke="url(#suspGrad)" strokeWidth="4" fill="none" strokeLinecap="round" />
    {/* 상단 마운트 */}
    <rect x="50" y="20" width="20" height="8" rx="2" fill="#ea580c" />
    {/* 하단 마운트 */}
    <rect x="50" y="72" width="20" height="8" rx="2" fill="#ea580c" />
    {/* 댐퍼 */}
    <rect x="56" y="35" width="8" height="35" rx="2" fill="#92400e" opacity="0.6" />
  </svg>
);

const LeafSpringIcon = () => (
  <svg viewBox="0 0 120 120" fill="none">
    <defs>
      <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#34d399" />
      </linearGradient>
    </defs>
    {/* 리프 스프링 레이어들 */}
    <path d="M 20 60 Q 60 40, 100 60" stroke="url(#leafGrad)" strokeWidth="6" fill="none" strokeLinecap="round" />
    <path d="M 25 62 Q 60 44, 95 62" stroke="#10b981" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.7" />
    <path d="M 30 64 Q 60 48, 90 64" stroke="#059669" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.5" />
    {/* 마운트 포인트 */}
    <circle cx="20" cy="60" r="5" fill="#047857" stroke="#34d399" strokeWidth="2" />
    <circle cx="100" cy="60" r="5" fill="#047857" stroke="#34d399" strokeWidth="2" />
  </svg>
);

const DroneIcon = () => (
  <svg viewBox="0 0 120 120" fill="none">
    <defs>
      <linearGradient id="droneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ef4444" />
        <stop offset="100%" stopColor="#f87171" />
      </linearGradient>
    </defs>
    {/* 중앙 본체 */}
    <rect x="50" y="50" width="20" height="20" rx="3" fill="url(#droneGrad)" />
    {/* 암 4개 */}
    <line x1="60" y1="60" x2="30" y2="30" stroke="#dc2626" strokeWidth="3" />
    <line x1="60" y1="60" x2="90" y2="30" stroke="#dc2626" strokeWidth="3" />
    <line x1="60" y1="60" x2="30" y2="90" stroke="#dc2626" strokeWidth="3" />
    <line x1="60" y1="60" x2="90" y2="90" stroke="#dc2626" strokeWidth="3" />
    {/* 프로펠러 */}
    <circle cx="30" cy="30" r="8" fill="#991b1b" opacity="0.3" />
    <circle cx="90" cy="30" r="8" fill="#991b1b" opacity="0.3" />
    <circle cx="30" cy="90" r="8" fill="#991b1b" opacity="0.3" />
    <circle cx="90" cy="90" r="8" fill="#991b1b" opacity="0.3" />
    {/* 모터 */}
    <circle cx="30" cy="30" r="4" fill="#7f1d1d" />
    <circle cx="90" cy="30" r="4" fill="#7f1d1d" />
    <circle cx="30" cy="90" r="4" fill="#7f1d1d" />
    <circle cx="90" cy="90" r="4" fill="#7f1d1d" />
  </svg>
);

// 모델명 -> 아이콘 매핑
const PRODUCT_ICONS = {
  "V4_Engine": V4EngineIcon,
  "Robot_Arm": RobotArmIcon,
  "Robot_Gripper": RobotGripperIcon,
  "Machine_Vice": MachineViceIcon,
  "Suspension": SuspensionIcon,
  "Leaf_Spring": LeafSpringIcon,
  "Drone": DroneIcon,
};

// 모델명 -> 한글 설명 매핑
const PRODUCT_DESCRIPTIONS = {
  "V4_Engine": "4기통 엔진의 구조와 작동 원리를 학습하세요",
  "Robot_Arm": "산업용 로봇 팔의 관절과 움직임을 탐구하세요",
  "Robot_Gripper": "정밀 그리퍼의 메커니즘을 이해하세요",
  "Machine_Vice": "공작물 고정 장치의 원리를 배워보세요",
  "Suspension": "자동차 서스펜션 시스템을 분석하세요",
  "Leaf_Spring": "판 스프링의 탄성 원리를 학습하세요",
  "Drone": "드론의 비행 메커니즘을 탐구하세요",
};

export default function ProductListPage({ field, onHome, onBack, onLearn, onLab, onTest }) {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setErrMsg(null);

      try {
        const res = await fetch("/api/models");
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        if (!alive) return;

        setModels(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!alive) return;
        setErrMsg(e?.message || "로드 실패");
        setModels([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);
  /*
    const filteredModels = useMemo(() => {
      const allow = FIELD_TO_MODEL_TITLES[field] || null;
      if (!allow) return models;
      if (allow.length === 0) return [];
      return models.filter((m) => allow.includes(m.title));
    }, [models, field]);
  */

  const filteredModels = useMemo(() => {
    const allow = FIELD_TO_MODEL_TITLES[field];
    if (!allow) return models;
    if (allow.length === 0) return [];

    // ⭐ 순서 고정 핵심 로직
    return allow
      .map(title => models.find(m => m.title === title))
      .filter(Boolean);
  }, [models, field]);

  return (
    <>
      <div className="noise-overlay" />
      <div className="ambient-glow glow-1" />
      <div className="ambient-glow glow-2" />

      <div className="page-wrapper">
        {/* NAV */}
        <nav className="nav">
          <div className="inner">
            <div className="nav-logo" onClick={onHome}>
              <span className="nav-logo-text">SIMVEX</span>
            </div>
          </div>
        </nav>

        {/* BODY */}
        <section className="pl-body">
          <div className="inner">
            <div className="pl-header">
              <div className="pl-header-left">
                <button className="pl-back-btn" onClick={onBack}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M10 2L4 7l6 5" />
                  </svg>
                </button>
                <h2 className="pl-title">{field}</h2>
              </div>
            </div>

            <div className="pl-divider" />

            {loading && (
              <div className="pl-status">
                <div className="pl-spinner" />
                <div>모델 목록을 불러오는 중...</div>
              </div>
            )}

            {!loading && errMsg && (
              <div className="pl-status error">
                <div>⚠️ 오류 발생</div>
                <div className="pl-error-msg">{errMsg}</div>
              </div>
            )}

            {!loading && !errMsg && filteredModels.length === 0 && (
              <div className="pl-status">
                <div>📦 이 분야에 등록된 모델이 아직 없습니다.</div>
                <div className="pl-hint">곧 추가될 예정입니다.</div>
              </div>
            )}

            {!loading && !errMsg && filteredModels.length > 0 && (
              <div className="pl-list">
                {filteredModels.map((model) => {
                  const IconComponent = PRODUCT_ICONS[model.title] || V4EngineIcon;
                  const description = PRODUCT_DESCRIPTIONS[model.title] || "3D 모델을 탐구하세요";

                  return (
                    <div
                      key={model.id}
                      className="pl-card"
                      onClick={() => onLearn?.(model)}
                    >
                      <div className="pl-card-icon">
                        <IconComponent />
                      </div>
                      <div className="pl-card-info">
                        <div className="pl-card-title">{model.title}</div>
                        <div className="pl-card-desc">{description}</div>
                      </div>
                      <div className="pl-card-arrow">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M7 4l6 6-6 6" />
                        </svg>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>


      </div>
    </>
  );
}