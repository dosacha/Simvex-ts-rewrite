// ExamFieldSelectPage.js
import { useState } from "react";
import "./Shared.css";
import "./Studypage.css"; // Study 페이지와 같은 스타일 사용

/* 기계 공학 — 기어 조합 */
const GearIcon = () => (
  <svg viewBox="0 0 58 58" fill="none">
    <defs>
      <linearGradient id="gearG1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#7ecae6" />
        <stop offset="100%" stopColor="#3a9bbf" />
      </linearGradient>
      <linearGradient id="gearG2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a78bfa" />
        <stop offset="100%" stopColor="#7c3aed" />
      </linearGradient>
    </defs>
    {/* 큰 기어 */}
    <circle cx="22" cy="28" r="11" fill="url(#gearG1)" />
    <circle cx="22" cy="28" r="5" fill="#1a2040" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => {
      const rad = (a * Math.PI) / 180;
      const x = 22 + 14 * Math.cos(rad);
      const y = 28 + 14 * Math.sin(rad);
      return (
        <rect
          key={i}
          x={x - 2.2}
          y={y - 2.2}
          width="4.4"
          height="4.4"
          rx="1"
          fill="url(#gearG1)"
          transform={`rotate(${a},${x},${y})`}
        />
      );
    })}
    {/* 작은 기어 */}
    <circle cx="40" cy="18" r="7.5" fill="url(#gearG2)" />
    <circle cx="40" cy="18" r="3.2" fill="#1a2040" />
    {[0, 60, 120, 180, 240, 300].map((a, i) => {
      const rad = (a * Math.PI) / 180;
      const x = 40 + 9.8 * Math.cos(rad);
      const y = 18 + 9.8 * Math.sin(rad);
      return (
        <rect
          key={i}
          x={x - 1.8}
          y={y - 1.8}
          width="3.6"
          height="3.6"
          rx="0.8"
          fill="url(#gearG2)"
          transform={`rotate(${a},${x},${y})`}
        />
      );
    })}
    {/* 눈 — 큰 기어 위에 작은 밝은 원 */}
    <circle cx="16" cy="22" r="2.2" fill="rgba(255,255,255,0.25)" />
  </svg>
);

/* 전기 전자 공학 — CPU 칩 */
const ChipIcon = () => (
  <svg viewBox="0 0 58 58" fill="none">
    <defs>
      <linearGradient id="chipBody" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#60a5fa" />
        <stop offset="100%" stopColor="#3b82f6" />
      </linearGradient>
      <linearGradient id="chipCenter" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#93c5fd" />
        <stop offset="100%" stopColor="#60a5fa" />
      </linearGradient>
    </defs>
    {/* 핀 — 위 */}
    {[14, 22, 30, 38].map((x, i) => (
      <rect key={`t${i}`} x={x} y="8" width="3" height="8" rx="1.5" fill="#60a5fa" />
    ))}
    {/* 핀 — 아래 */}
    {[14, 22, 30, 38].map((x, i) => (
      <rect key={`b${i}`} x={x} y="42" width="3" height="8" rx="1.5" fill="#60a5fa" />
    ))}
    {/* 핀 — 왼쪽 */}
    {[18, 26, 34].map((y, i) => (
      <rect key={`l${i}`} x="8" y={y} width="8" height="3" rx="1.5" fill="#60a5fa" />
    ))}
    {/* 핀 — 오른쪽 */}
    {[18, 26, 34].map((y, i) => (
      <rect key={`r${i}`} x="42" y={y} width="8" height="3" rx="1.5" fill="#60a5fa" />
    ))}
    {/* 본체 */}
    <rect x="14" y="16" width="30" height="26" rx="4" fill="url(#chipBody)" />
    {/* 중앙 칩 다이 */}
    <rect x="20" y="21" width="18" height="16" rx="2" fill="url(#chipCenter)" />
    {/* 회로 패턴 */}
    <rect x="22" y="24" width="4" height="3" rx="0.8" fill="rgba(255,255,255,0.3)" />
    <rect x="28" y="24" width="6" height="2" rx="0.8" fill="rgba(255,255,255,0.25)" />
    <rect x="22" y="29" width="6" height="2" rx="0.8" fill="rgba(255,255,255,0.2)" />
    <rect x="30" y="28" width="4" height="4" rx="0.8" fill="rgba(255,255,255,0.3)" />
  </svg>
);

/* 항공 우주 공학 — 로켓 */
const RocketIcon = () => (
  <svg viewBox="0 0 58 58" fill="none">
    <defs>
      <linearGradient id="rocketBody" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="50%" stopColor="#fcd34d" />
        <stop offset="100%" stopColor="#fff" />
      </linearGradient>
      <linearGradient id="rocketFlame" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="60%" stopColor="#f97316" />
        <stop offset="100%" stopColor="#ef4444" />
      </linearGradient>
    </defs>
    {/* 불꽃 */}
    <ellipse cx="29" cy="50" rx="4" ry="7" fill="url(#rocketFlame)" opacity="0.9" />
    <ellipse cx="29" cy="48" rx="2.5" ry="4" fill="#fde68a" />
    {/* 날개 왼쪽 */}
    <path d="M20,38 L14,48 L22,42 Z" fill="#e11d48" />
    {/* 날개 오른쪽 */}
    <path d="M38,38 L44,48 L36,42 Z" fill="#e11d48" />
    {/* 본체 */}
    <path d="M29,6 Q22,20 20,34 L38,34 Q36,20 29,6 Z" fill="url(#rocketBody)" />
    {/* 창문 */}
    <circle cx="29" cy="22" r="4.5" fill="#1e3a5f" stroke="#60a5fa" strokeWidth="1.2" />
    <circle cx="29" cy="22" r="2" fill="#93c5fd" />
    {/* 꼭짓점 빛 */}
    <circle cx="29" cy="7" r="1.5" fill="#fff" opacity="0.8" />
  </svg>
);

/* 재료 과학 — 원자 모델 */
const AtomIcon = () => (
  <svg viewBox="0 0 58 58" fill="none">
    <defs>
      <linearGradient id="orb1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a78bfa" />
        <stop offset="100%" stopColor="#7c3aed" />
      </linearGradient>
      <linearGradient id="orb2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#67e8f9" />
        <stop offset="100%" stopColor="#06b6d4" />
      </linearGradient>
      <linearGradient id="orb3" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#86efac" />
        <stop offset="100%" stopColor="#22c55e" />
      </linearGradient>
    </defs>
    {/* 궤도 타원 1 */}
    <ellipse
      cx="29"
      cy="29"
      rx="22"
      ry="10"
      fill="none"
      stroke="rgba(167,139,250,0.45)"
      strokeWidth="1.5"
      transform="rotate(-30,29,29)"
    />
    {/* 궤도 타원 2 */}
    <ellipse
      cx="29"
      cy="29"
      rx="22"
      ry="10"
      fill="none"
      stroke="rgba(103,232,249,0.45)"
      strokeWidth="1.5"
      transform="rotate(30,29,29)"
    />
    {/* 궤도 타원 3 */}
    <ellipse
      cx="29"
      cy="29"
      rx="22"
      ry="10"
      fill="none"
      stroke="rgba(134,239,172,0.45)"
      strokeWidth="1.5"
      transform="rotate(90,29,29)"
    />
    {/* 궤도 위 전자 */}
    <circle cx="8" cy="29" r="3.2" fill="url(#orb1)" />
    <circle cx="29" cy="7" r="3.2" fill="url(#orb2)" />
    <circle cx="50" cy="29" r="3.2" fill="url(#orb3)" />
    {/* 중앙 핵 */}
    <circle cx="29" cy="29" r="6" fill="url(#orb1)" opacity="0.9" />
    <circle cx="29" cy="29" r="3.5" fill="#fff" opacity="0.25" />
  </svg>
);

/* 화학 공학 — 비커 + 거품 */
const BeakerIcon = () => (
  <svg viewBox="0 0 58 58" fill="none">
    <defs>
      <linearGradient id="liquid" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
      <linearGradient id="beakerG" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="rgba(100,200,180,0.3)" />
        <stop offset="100%" stopColor="rgba(60,140,130,0.2)" />
      </linearGradient>
    </defs>
    {/* 비커 본체 */}
    <path
      d="M18,16 L18,44 Q18,48 22,48 L36,48 Q40,48 40,44 L40,16"
      fill="url(#beakerG)"
      stroke="rgba(52,211,153,0.5)"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    {/* 입구 */}
    <rect x="15" y="14" width="28" height="4" rx="2" fill="rgba(52,211,153,0.35)" stroke="rgba(52,211,153,0.5)" strokeWidth="0.8" />
    {/* 뚜꼭지 */}
    <rect x="13" y="15" width="6" height="2.5" rx="1.2" fill="rgba(52,211,153,0.5)" />
    {/* 액체 */}
    <path
      d="M18,30 Q22,28 29,32 Q35,28 40,30 L40,44 Q40,48 36,48 L22,48 Q18,48 18,44 Z"
      fill="url(#liquid)"
      opacity="0.8"
    />
    {/* 거품 */}
    <circle cx="23" cy="29" r="3" fill="#34d399" opacity="0.7" />
    <circle cx="30" cy="27" r="2.2" fill="#6ee7b7" opacity="0.6" />
    <circle cx="35" cy="29" r="2.5" fill="#34d399" opacity="0.65" />
    <circle cx="27" cy="24" r="1.8" fill="#a7f3d0" opacity="0.5" />
    {/* 반사 */}
    <ellipse cx="24" cy="22" rx="3" ry="5" fill="rgba(255,255,255,0.08)" />
  </svg>
);

/* 토목 공학 — 다리 */
const BridgeIcon = () => (
  <svg viewBox="0 0 58 58" fill="none">
    <defs>
      <linearGradient id="bridgeG" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#60a5fa" />
        <stop offset="100%" stopColor="#2563eb" />
      </linearGradient>
    </defs>
    {/* 기둥 */}
    <rect x="6" y="28" width="5" height="22" rx="2" fill="url(#bridgeG)" />
    <rect x="47" y="28" width="5" height="22" rx="2" fill="url(#bridgeG)" />
    {/* 윗보/아랫보 */}
    <rect x="4" y="26" width="50" height="4" rx="2" fill="url(#bridgeG)" />
    <rect x="4" y="38" width="50" height="3.5" rx="1.8" fill="url(#bridgeG)" opacity="0.75" />
    {/* 수직 */}
    {[14, 22, 29, 36, 44].map((x, i) => (
      <rect key={`v${i}`} x={x} y="28" width="2.5" height="10.5" fill="url(#bridgeG)" opacity="0.7" />
    ))}
    {/* 트러스 */}
    <line x1="8" y1="28" x2="15.5" y2="38" stroke="url(#bridgeG)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    <line x1="15.5" y1="28" x2="23" y2="38" stroke="url(#bridgeG)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    <line x1="29" y1="28" x2="36.5" y2="38" stroke="url(#bridgeG)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    <line x1="36.5" y1="28" x2="44" y2="38" stroke="url(#bridgeG)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    <line x1="15.5" y1="28" x2="8" y2="38" stroke="url(#bridgeG)" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
    <line x1="23" y1="28" x2="15.5" y2="38" stroke="url(#bridgeG)" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
    <line x1="36.5" y1="28" x2="29" y2="38" stroke="url(#bridgeG)" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
    <line x1="44" y1="28" x2="36.5" y2="38" stroke="url(#bridgeG)" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
    {/* 하단 */}
    <ellipse cx="29" cy="51" rx="24" ry="3" fill="rgba(96,165,250,0.1)" />
  </svg>
);

/* ════════════════════════════════════════════ */
/*  카드 데이터                                  */
/* ════════════════════════════════════════════ */

const FIELDS = [
  { icon: <GearIcon />, glowColor: "#7ecae6", title: "기계 공학" },
  { icon: <ChipIcon />, glowColor: "#60a5fa", title: "전기 전자 공학" },
  { icon: <RocketIcon />, glowColor: "#fcd34d", title: "항공 우주 공학" },
  { icon: <AtomIcon />, glowColor: "#a78bfa", title: "재료 과학" },
  { icon: <BeakerIcon />, glowColor: "#34d399", title: "화학 공학" },
  { icon: <BridgeIcon />, glowColor: "#60a5fa", title: "토목 공학" },
];

export default function ExamFieldSelectPage({ onHome, onStudy, onLab, onTest, onFieldSelect }) {
  const [activeNav, setActiveNav] = useState("Test");
  const navItems = ["Home", "Study", "CAD", "Lab", "Test"];

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

            <div className="nav-links">
              {navItems.map((item) => (
                <button
                  key={item}
                  className={`nav-link${activeNav === item ? " active" : ""}`}
                  onClick={() => handleNav(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* BODY */}
        <section className="study-body">
          <div className="inner">
            <h2 className="study-title">모의고사 분야 선택</h2>

            <div className="study-grid">
              {FIELDS.map((field, i) => (
                <div
                  key={i}
                  className="study-card"
                  onClick={() => onFieldSelect?.(field.title)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="study-icon-wrap">
                    {field.icon}
                    <div className="icon-glow" style={{ background: field.glowColor }} />
                  </div>
                  <h3 className="study-card-title">{field.title}</h3>
                  <p className="study-card-desc">이 분야의 모의고사를 선택하세요.</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </>
  );
}