import { useState } from "react";
import "./Shared.css";
import "./Simvexlanding.css";

/* ════════════════════════════════════════════ */
/*  SVG ICONS                                   */
/* ════════════════════════════════════════════ */
const Icon3D = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
);
const IconAI = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
  </svg>
);
const IconTest = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* 시험지 */}
    <path d="M6 2h9l3 3v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
    <path d="M15 2v3h3" />

    {/* 문제 줄 */}
    <path d="M8 9h6" />
    <path d="M8 13h6" />

    {/* 체크 표시 */}
    <path d="M8 17l2 2 4-4" />
  </svg>
);

/* ════════════════════════════════════════════ */
/*  ENGINE SVG                                  */
/* ════════════════════════════════════════════ */
/* ════════════════════════════════════════════ */
/*  ENGINE VISUAL — 고급 3D 엔진 분해도          */
/* ════════════════════════════════════════════ */
const EngineVisual = () => (
  <svg viewBox="0 0 520 440" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      {/* ── 기본 그래디엔트 ── */}
      <linearGradient id="bgAmbient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0a1628" /><stop offset="100%" stopColor="#060e1a" />
      </linearGradient>

      {/* ── 엔진 본체 ── */}
      <linearGradient id="hullGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3a5a7a" /><stop offset="30%" stopColor="#2a4060" /><stop offset="70%" stopColor="#1e3050" /><stop offset="100%" stopColor="#122440" />
      </linearGradient>
      <linearGradient id="hullShine" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.12)" /><stop offset="40%" stopColor="rgba(255,255,255,0)" />
      </linearGradient>

      {/* ── 블레이드 층 ── */}
      <linearGradient id="blade1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#7dd3e0" /><stop offset="50%" stopColor="#4aafc4" /><stop offset="100%" stopColor="#2a7a9a" />
      </linearGradient>
      <linearGradient id="blade2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a8c8d8" /><stop offset="50%" stopColor="#6a9ab5" /><stop offset="100%" stopColor="#3d6e8a" />
      </linearGradient>
      <linearGradient id="blade3" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#d4e8f0" /><stop offset="50%" stopColor="#8bbccc" /><stop offset="100%" stopColor="#5a9aaa" />
      </linearGradient>
      <linearGradient id="bladeRing" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#5abcd0" /><stop offset="100%" stopColor="#2d7a8f" />
      </linearGradient>

      {/* ── 후방 노즐 ── */}
      <linearGradient id="nozzleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#2a3a50" /><stop offset="50%" stopColor="#1a2838" /><stop offset="100%" stopColor="#253848" />
      </linearGradient>
      <linearGradient id="flameCoreG" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fff7a0" stopOpacity="0.9" /><stop offset="50%" stopColor="#ffaa44" stopOpacity="0.6" /><stop offset="100%" stopColor="#ff6622" stopOpacity="0" />
      </linearGradient>

      {/* ── PCB ── */}
      <linearGradient id="pcbBase" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1a3828" /><stop offset="100%" stopColor="#0f2418" />
      </linearGradient>
      <linearGradient id="pcbShine" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="rgba(100,200,160,0.12)" /><stop offset="100%" stopColor="rgba(100,200,160,0)" />
      </linearGradient>

      {/* ── 히어트싱크 ── */}
      <linearGradient id="heatSinkG" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4a6878" /><stop offset="100%" stopColor="#2a4a5a" />
      </linearGradient>
      <linearGradient id="heatPinG" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#6a9aaa" /><stop offset="100%" stopColor="#3a6a7a" />
      </linearGradient>

      {/* ── 커넥터 모듈 ── */}
      <linearGradient id="moduleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2a3550" /><stop offset="100%" stopColor="#1a2538" />
      </linearGradient>

      {/* ── 필터 ── */}
      <filter id="glow2">
        <feGaussianBlur stdDeviation="2.5" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <filter id="softBlur"><feGaussianBlur stdDeviation="3" /></filter>
      <filter id="tinyGlow">
        <feGaussianBlur stdDeviation="1.2" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <filter id="dropShadow">
        <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.4" />
      </filter>
    </defs>

    {/* ══════════════════════════════════════════ */}
    {/* 배경 앰비언트 글로우                         */}
    {/* ══════════════════════════════════════════ */}
    <ellipse cx="200" cy="160" rx="160" ry="100" fill="rgba(0,188,212,0.06)" filter="url(#softBlur)" />
    <ellipse cx="340" cy="320" rx="100" ry="70" fill="rgba(30,100,60,0.07)" filter="url(#softBlur)" />
    <ellipse cx="100" cy="350" rx="80" ry="50" fill="rgba(60,140,160,0.05)" filter="url(#softBlur)" />

    {/* ══════════════════════════════════════════ */}
    {/* 연결선 (와이어) — 부품 사이 연결           */}
    {/* ══════════════════════════════════════════ */}
    {/* 엔진 → PCB */}
    <path d="M295,175 Q310,200 320,230 Q325,255 318,275" stroke="rgba(100,200,180,0.35)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    <path d="M298,178 Q312,202 322,232 Q327,257 320,277" stroke="rgba(100,200,180,0.15)" strokeWidth="3" fill="none" strokeLinecap="round" />
    {/* PCB → 히어트싱크 */}
    <path d="M290,330 Q250,350 200,360 Q160,365 140,358" stroke="rgba(100,200,180,0.3)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <path d="M292,332 Q252,352 202,362 Q162,367 142,360" stroke="rgba(100,200,180,0.12)" strokeWidth="3" fill="none" strokeLinecap="round" />
    {/* PCB → 모듈 (오른쪽) */}
    <path d="M410,290 Q430,270 440,250 Q445,235 438,218" stroke="rgba(100,200,180,0.3)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <path d="M412,292 Q432,272 442,252 Q447,237 440,220" stroke="rgba(100,200,180,0.12)" strokeWidth="3" fill="none" strokeLinecap="round" />

    {/* ══════════════════════════════════════════ */}
    {/* 제트 엔진 본체 (중앙 상단)                  */}
    {/* ══════════════════════════════════════════ */}
    <g filter="url(#dropShadow)">
      {/* 후방 노즐 */}
      <path d="M275,130 L310,108 L310,152 L275,135 Z" fill="url(#nozzleGrad)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />
      <path d="M310,108 L340,115 L340,145 L310,152 Z" fill="#1a2838" stroke="rgba(255,255,255,0.06)" strokeWidth="0.6" />
      {/* 불꽃 이펙트 */}
      <ellipse cx="345" cy="130" rx="18" ry="8" fill="url(#flameCoreG)" opacity="0.7" />
      <ellipse cx="350" cy="130" rx="10" ry="4" fill="#ffe88a" opacity="0.5" />

      {/* 엔진 메인 躯体 — 타원형 단면 */}
      <ellipse cx="195" cy="132" rx="88" ry="52" fill="url(#hullGrad)" stroke="#4a7a9a" strokeWidth="1.8" />
      <ellipse cx="195" cy="132" rx="88" ry="52" fill="url(#hullShine)" />

      {/* 엔진 躯体 위의 금속 패널 선 */}
      <path d="M118,105 Q195,95 272,105" stroke="rgba(255,255,255,0.07)" strokeWidth="1.2" fill="none" />
      <path d="M115,118 Q195,110 275,118" stroke="rgba(255,255,255,0.05)" strokeWidth="0.8" fill="none" />
      <path d="M115,145 Q195,155 275,145" stroke="rgba(255,255,255,0.05)" strokeWidth="0.8" fill="none" />

      {/* ── 블레이드 층 1 (가장 큰 앞 )── */}
      <ellipse cx="140" cy="132" rx="10" ry="48" fill="#0d1e2e" stroke="#3a6a8a" strokeWidth="1.2" />
      <ellipse cx="140" cy="132" rx="8" ry="44" fill="url(#blade1)" opacity="0.6" />
      {/* 블레이드 개별 — 12개 */}
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * 360;
        const rad = a * Math.PI / 180;
        const cx = 140, cy = 132, r = 38;
        const x1 = cx + r * Math.cos(rad), y1 = cy + r * Math.sin(rad);
        const x2 = cx + 6 * Math.cos(rad), y2 = cy + 6 * Math.sin(rad);
        return <line key={`b1-${i}`} x1={x2} y1={y2} x2={x1} y2={y1}
          stroke="url(#blade1)" strokeWidth="4" strokeLinecap="round" opacity="0.9" />;
      })}
      {/* 블레이드 중앙 보스 */}
      <circle cx="140" cy="132" r="7" fill="#1a3a50" stroke="#5abcd0" strokeWidth="1.5" />
      <circle cx="140" cy="132" r="3" fill="#00e5ff" filter="url(#glow2)" />

      {/* ── 블레이드 층 2 (중간) ── */}
      <ellipse cx="185" cy="132" rx="8" ry="38" fill="#0d1e2e" stroke="#3a6a8a" strokeWidth="1" />
      <ellipse cx="185" cy="132" rx="6" ry="34" fill="url(#blade2)" opacity="0.55" />
      {Array.from({ length: 10 }).map((_, i) => {
        const a = (i / 10) * 360 + 18;
        const rad = a * Math.PI / 180;
        const cx = 185, cy = 132, r = 28;
        const x1 = cx + r * Math.cos(rad), y1 = cy + r * Math.sin(rad);
        const x2 = cx + 5 * Math.cos(rad), y2 = cy + 5 * Math.sin(rad);
        return <line key={`b2-${i}`} x1={x2} y1={y2} x2={x1} y2={y1}
          stroke="url(#blade2)" strokeWidth="3.2" strokeLinecap="round" opacity="0.85" />;
      })}
      <circle cx="185" cy="132" r="5.5" fill="#1a3a50" stroke="#5abcd0" strokeWidth="1.2" />
      <circle cx="185" cy="132" r="2.2" fill="#00e5ff" filter="url(#glow2)" />

      {/* ── 블레이드 층 3 (가장 작은 뒤) ── */}
      <ellipse cx="225" cy="132" rx="6" ry="28" fill="#0d1e2e" stroke="#3a6a8a" strokeWidth="0.8" />
      <ellipse cx="225" cy="132" rx="4.5" ry="24" fill="url(#blade3)" opacity="0.5" />
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * 360 + 22;
        const rad = a * Math.PI / 180;
        const cx = 225, cy = 132, r = 19;
        const x1 = cx + r * Math.cos(rad), y1 = cy + r * Math.sin(rad);
        const x2 = cx + 4 * Math.cos(rad), y2 = cy + 4 * Math.sin(rad);
        return <line key={`b3-${i}`} x1={x2} y1={y2} x2={x1} y2={y1}
          stroke="url(#blade3)" strokeWidth="2.6" strokeLinecap="round" opacity="0.8" />;
      })}
      <circle cx="225" cy="132" r="4.2" fill="#1a3a50" stroke="#5abcd0" strokeWidth="1" />
      <circle cx="225" cy="132" r="1.8" fill="#00e5ff" filter="url(#tinyGlow)" />

      {/* ── 블레이드 링 구조체 ── */}
      <circle cx="140" cy="132" r="48" fill="none" stroke="url(#bladeRing)" strokeWidth="1.8" opacity="0.6" />
      <circle cx="185" cy="132" r="34" fill="none" stroke="url(#bladeRing)" strokeWidth="1.3" opacity="0.5" />
      <circle cx="225" cy="132" r="24" fill="none" stroke="url(#bladeRing)" strokeWidth="1" opacity="0.45" />

      {/* 엔진 앞 케이스 캵 (왼쪽 끝) */}
      <ellipse cx="107" cy="132" rx="12" ry="40" fill="#162535" stroke="#3a5a75" strokeWidth="1.2" />
      <ellipse cx="107" cy="132" rx="4" ry="12" fill="#0a1520" stroke="#2a4a60" strokeWidth="0.8" />

      {/* LED 디테일 — 엔진 위 */}
      <circle cx="160" cy="88" r="2" fill="#00e5ff" filter="url(#tinyGlow)" opacity="0.8" />
      <circle cx="200" cy="86" r="1.8" fill="#00e5ff" filter="url(#tinyGlow)" opacity="0.6" />
      <circle cx="240" cy="90" r="1.5" fill="#00e5ff" filter="url(#tinyGlow)" opacity="0.4" />
    </g>

    {/* ══════════════════════════════════════════ */}
    {/* PCB 보드 (중앙 하단)                        */}
    {/* ══════════════════════════════════════════ */}
    <g filter="url(#dropShadow)">
      {/* PCB 본체 */}
      <rect x="280" y="265" width="150" height="105" rx="5" fill="url(#pcbBase)" stroke="#2a5a48" strokeWidth="1.2" />
      <rect x="280" y="265" width="150" height="105" rx="5" fill="url(#pcbShine)" />

      {/* 회로 트레이스 패턴 — 복잡한 선들 */}
      {/* 메인 트레이스 루트 */}
      <path d="M292,278 L320,278 L320,295 L350,295" stroke="#1e7a5a" strokeWidth="1.3" fill="none" />
      <path d="M292,290 L305,290 L305,310 L330,310 L330,325" stroke="#1e7a5a" strokeWidth="1" fill="none" />
      <path d="M350,278 L380,278 L380,295 L410,295" stroke="#1e7a5a" strokeWidth="1.1" fill="none" />
      <path d="M350,295 L365,295 L365,315 L390,315" stroke="#1e7a5a" strokeWidth="0.9" fill="none" />
      <path d="M292,320 L315,320 L315,340 L340,340" stroke="#1e7a5a" strokeWidth="1" fill="none" />
      <path d="M380,310 L400,310 L400,335 L385,335" stroke="#1e7a5a" strokeWidth="0.9" fill="none" />
      <path d="M340,340 L360,340 L360,355 L395,355" stroke="#1e7a5a" strokeWidth="0.8" fill="none" />
      <path d="M330,325 L345,325 L345,345" stroke="#1e7a5a" strokeWidth="0.8" fill="none" />
      {/* 세부 트레이스 */}
      <path d="M292,305 L300,305 L300,318" stroke="#167050" strokeWidth="0.7" fill="none" />
      <path d="M370,280 L370,292" stroke="#167050" strokeWidth="0.7" fill="none" />
      <path d="M395,300 L395,312" stroke="#167050" strokeWidth="0.7" fill="none" />
      <path d="M310,345 L310,358" stroke="#167050" strokeWidth="0.6" fill="none" />
      <path d="M385,340 L385,355" stroke="#167050" strokeWidth="0.6" fill="none" />

      {/* 트레이스 노드 점들 */}
      {[[292, 278], [320, 278], [320, 295], [350, 295], [305, 290], [305, 310], [330, 310], [330, 325],
      [380, 278], [410, 295], [365, 295], [365, 315], [390, 315], [315, 320], [315, 340], [340, 340],
      [400, 310], [400, 335], [360, 340], [360, 355], [395, 355], [345, 325], [345, 345],
      [300, 305], [300, 318], [370, 280], [370, 292], [395, 300], [395, 312], [310, 345], [385, 340], [385, 355]
      ].map(([x, y], i) => <circle key={`n${i}`} cx={x} cy={y} r="1.8" fill="#3aaa7a" />)}

      {/* ── 메인 CPU 칩 ── */}
      <rect x="325" y="290" width="42" height="32" rx="3" fill="#1a1e2e" stroke="#3a4a6a" strokeWidth="1" />
      {/* CPU 핀 — 윗변 */}
      {[329, 335, 341, 347, 353, 359].map((x, i) => <rect key={`ct${i}`} x={x} y="287" width="3" height="5" rx="1" fill="#4a6a8a" />)}
      {/* CPU 핀 — 아랫변 */}
      {[329, 335, 341, 347, 353, 359].map((x, i) => <rect key={`cb${i}`} x={x} y="320" width="3" height="5" rx="1" fill="#4a6a8a" />)}
      {/* CPU 핀 — 왼쪽 */}
      {[293, 299, 305].map((y, i) => <rect key={`cl${i}`} x="322" y={y} width="5" height="3" rx="1" fill="#4a6a8a" />)}
      {/* CPU 핀 — 오른쪽 */}
      {[293, 299, 305].map((y, i) => <rect key={`cr${i}`} x="365" y={y} width="5" height="3" rx="1" fill="#4a6a8a" />)}
      {/* CPU 다이 중앙 */}
      <rect x="334" y="298" width="24" height="16" rx="2" fill="#2a3050" stroke="#5a7aaa" strokeWidth="0.8" />
      <rect x="337" y="301" width="8" height="4" rx="1" fill="rgba(90,150,200,0.5)" />
      <rect x="347" y="301" width="6" height="4" rx="1" fill="rgba(90,150,200,0.4)" />
      <rect x="337" y="307" width="12" height="3" rx="1" fill="rgba(90,150,200,0.35)" />
      <rect x="351" y="306" width="5" height="5" rx="1" fill="rgba(90,150,200,0.45)" />

      {/* ── 작은 칩들 ── */}
      {/* 칩 A */}
      <rect x="292" y="330" width="22" height="16" rx="2" fill="#1c2038" stroke="#3a4a6a" strokeWidth="0.8" />
      <rect x="296" y="333" width="6" height="3" rx="0.8" fill="rgba(80,140,180,0.5)" />
      <rect x="296" y="338" width="10" height="2.5" rx="0.8" fill="rgba(80,140,180,0.4)" />
      {/* 칩 B */}
      <rect x="385" y="320" width="18" height="14" rx="2" fill="#1c2038" stroke="#3a4a6a" strokeWidth="0.8" />
      <rect x="388" y="323" width="5" height="3" rx="0.8" fill="rgba(80,140,180,0.45)" />
      <rect x="388" y="328" width="8" height="2" rx="0.8" fill="rgba(80,140,180,0.35)" />
      {/* 칩 C (작은 것) */}
      <rect x="370" y="348" width="14" height="10" rx="1.5" fill="#1c2038" stroke="#3a4a6a" strokeWidth="0.7" />
      <rect x="372" y="350" width="4" height="2.5" rx="0.6" fill="rgba(80,140,180,0.4)" />

      {/* ── 커패시터 ── */}
      <rect x="290" y="275" width="4" height="9" rx="1.5" fill="#2a5a3a" stroke="#4aaa7a" strokeWidth="0.5" />
      <rect x="296" y="275" width="4" height="9" rx="1.5" fill="#2a5a3a" stroke="#4aaa7a" strokeWidth="0.5" />
      <rect x="400" y="275" width="4" height="8" rx="1.5" fill="#2a5a3a" stroke="#4aaa7a" strokeWidth="0.5" />

      {/* ── LED 디테일 ── */}
      <circle cx="418" cy="272" r="2.2" fill="#00e5ff" filter="url(#tinyGlow)" />
      <circle cx="425" cy="272" r="2.2" fill="#44ff88" filter="url(#tinyGlow)" opacity="0.85" />
      <circle cx="418" cy="362" r="2" fill="#ff6644" filter="url(#tinyGlow)" opacity="0.8" />
    </g>

    {/* ══════════════════════════════════════════ */}
    {/* 히어트싱크 (왼쪽 하단)                     */}
    {/* ══════════════════════════════════════════ */}
    <g filter="url(#dropShadow)">
      {/* 베이스 플레이트 */}
      <rect x="60" y="348" width="90" height="18" rx="3" fill="url(#heatSinkG)" stroke="#5a8a9a" strokeWidth="1" />
      <rect x="60" y="348" width="90" height="6" rx="3" fill="rgba(255,255,255,0.06)" />
      {/* 핀 — 10개 */}
      {Array.from({ length: 10 }).map((_, i) => {
        const x = 68 + i * 8;
        return <g key={`hp${i}`}>
          <rect x={x} y="318" width="5" height="32" rx="2" fill="url(#heatPinG)" stroke="#5a9aaa" strokeWidth="0.6" />
          <rect x={x} y="318" width="5" height="4" rx="2" fill="rgba(255,255,255,0.1)" />
        </g>;
      })}
      {/* 베이스 아래 그림자 강화 */}
      <rect x="62" y="365" width="86" height="3" rx="1.5" fill="rgba(0,0,0,0.3)" />
    </g>

    {/* ══════════════════════════════════════════ */}
    {/* 커넥터 모듈 (오른쪽 상단)                  */}
    {/* ══════════════════════════════════════════ */}
    <g filter="url(#dropShadow)">
      {/* 모듈 본체 */}
      <rect x="415" y="175" width="70" height="52" rx="5" fill="url(#moduleGrad)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      <rect x="415" y="175" width="70" height="10" rx="5" fill="rgba(255,255,255,0.05)" />
      {/* 내부 커넥터 슬롯 — 윗줄 */}
      <rect x="422" y="190" width="56" height="10" rx="2" fill="#111d2e" stroke="#2a3a55" strokeWidth="0.6" />
      {[424, 431, 438, 445, 452, 459, 466].map((x, i) => <rect key={`ms1-${i}`} x={x} y="192" width="4" height="6" rx="1" fill="#2a3a55" stroke="#3a5070" strokeWidth="0.4" />)}
      {/* 내부 커넥터 슬롯 — 아랫줄 */}
      <rect x="422" y="206" width="56" height="10" rx="2" fill="#111d2e" stroke="#2a3a55" strokeWidth="0.6" />
      {[424, 431, 438, 445, 452, 459, 466].map((x, i) => <rect key={`ms2-${i}`} x={x} y="208" width="4" height="6" rx="1" fill="#2a3a55" stroke="#3a5070" strokeWidth="0.4" />)}
      {/* 모듈 라벨 영역 */}
      <rect x="422" y="220" width="56" height="4" rx="1" fill="rgba(255,255,255,0.04)" />
      {/* LED */}
      <circle cx="478" cy="180" r="1.8" fill="#00e5ff" filter="url(#tinyGlow)" opacity="0.7" />
    </g>

    {/* ══════════════════════════════════════════ */}
    {/* 전체 앰비언트 글로우 — 최종 레이어          */}
    {/* ══════════════════════════════════════════ */}
    <ellipse cx="140" cy="132" rx="55" ry="55" fill="rgba(0,188,212,0.04)" filter="url(#softBlur)" />
    <ellipse cx="355" cy="315" rx="50" ry="40" fill="rgba(30,120,80,0.05)" filter="url(#softBlur)" />
  </svg>
);

/* ════════════════════════════════════════════ */
/*  MAIN                                        */
/* ════════════════════════════════════════════ */
export default function SimvexLanding({ onStart, onLab, onTest }) {
  const [activeNav, setActiveNav] = useState("Home");
  const navItems = ["Home", "Study", "CAD", "Lab", "Test"];

  // Study 클릭 시에도 학습페이지로
  const handleNav = (item) => {
    if (item === "CAD") {
      alert("페이지 준비중입니다");
      return;
    }
    setActiveNav(item);
    if (item === "Study") onStart();
    if (item === "Lab") onLab?.();
    if (item === "Test") onTest?.();
  };

  const cards = [
    { icon: <Icon3D />, title: "실감 나는 3D 학습", desc: "실제 엔진과 동일한 구조로 제공되는 3D 모델을 통해 학습 과정을 더 깊게 체험하세요." },
    { icon: <IconAI />, title: "AI 맞춤형 가이드", desc: "AI 기반의 맞춤형 학습 경험을 통해 학습자의 수준에 맞게 최적화된 도움을 받습니다." },
    { icon: <IconTest />, title: "분야별 모의고사 학습", desc: "기계 공학, 전기 전자 공학, 화학 공학 등 원하는 분야와 모델을 선택해 실전형 모의고사 문제를 풀어보세요." },
  ];

  return (
    <>
      <div className="noise-overlay" />
      <div className="ambient-glow glow-1" />
      <div className="ambient-glow glow-2" />

      <div className="page-wrapper">
        <nav className="nav">
          <div className="inner">
            <div className="nav-logo">
              <span className="nav-logo-text">SIMVEX</span>
            </div>
            <div className="nav-links">
              {navItems.map((item) => (
                <button key={item} className={`nav-link${activeNav === item ? " active" : ""}`} onClick={() => handleNav(item)}>{item}</button>
              ))}
            </div>
          </div>
        </nav>

        <section className="hero">
          <div className="inner">
            <div className="hero-content">
              <h1 className="hero-title">
                미래의 엔지니어를 위한<br />혁신적인 학습 플랫폼,<br /><span className="highlight">SIMVEX</span>
              </h1>
              <p className="hero-sub">공대생과 과학기술 학습자를 위한 최고의<br />도구와 리소스를 경험하세요.</p>
              <button className="hero-btn" onClick={onStart}>지금 시작하기</button>
            </div>
            <div className="hero-visual">
              <div className="engine-scene">
                <EngineVisual />
                <div className="scene-glow" />
              </div>
            </div>
          </div>
        </section>

        <section className="cards-section">
          <div className="inner">
            {cards.map((c, i) => (
              <div key={i} className="card">
                <div className="card-icon-wrap">{c.icon}</div>
                <h3 className="card-title">{c.title}</h3>
                <p className="card-desc">{c.desc}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </>
  );
}