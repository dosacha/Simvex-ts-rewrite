// Learnpage.js
import { useState, useRef, useCallback, useEffect } from "react";
import "./Shared.css";
import "./Learnpage.css";
import { getUserId } from "./utils/auth"; // 새로 만든 auth 유틸 import

// pdf generation libraries (CDN 사용 시 주석 유지)
//import jsPDF from "jspdf";
//import html2canvas from "html2canvas";

import ThreeViewer from "./ThreeViewer";

const normalizeMeshKey = (s) =>
  (s || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_"); // 하이픈/공백 등 -> _

const PART_THUMBS_BY_MODEL = {
  Suspension: {
    base: "/assets/suspension/base.png",
    nut: "/assets/suspension/nut.png",
    rod: "/assets/suspension/rod.png",
    spring: "/assets/suspension/spring.png",
  },
  Machine_Vice: {
    part1_fuhrung: "/assets/machine_vice/part1_fuhrung.png",
    part2_feste_backe: "/assets/machine_vice/part2_feste_backe.png",
    part3_lose_backe: "/assets/machine_vice/part3_lose_backe.png",
    part4_spindelsockel: "/assets/machine_vice/part4_spindelsockel.png",
    part5_spannbacke: "/assets/machine_vice/part5_spannbacke.png",
    part6_fuhrungschiene01: "/assets/machine_vice/part6_fuhrungschiene.png",
    part7_trapezspindel: "/assets/machine_vice/part7_trapezspindel.png",
    part8_grundplatte:"/assets/machine_vice/part8_grundplatte.png",
    part9_druckhulse01:"/assets/machine_vice/part9_druckhulse.png",
    part6_fuhrungschiene02: "/assets/machine_vice/part6_fuhrungschiene.png",
    part9_druckhulse02:"/assets/machine_vice/part9_druckhulse.png",
    part9_druckhulse03:"/assets/machine_vice/part9_druckhulse.png",
    part9_druckhulse04:"/assets/machine_vice/part9_druckhulse.png",

  },
  V4_Engine:{
    connecting_rod04:"/assets/v4_engine/connecting_rod.png",
    connecting_rod_cap01:"/assets/v4_engine/connecting_rod_cap.png",
    conrod_bolt:"/assets/v4_engine/conrod_bolt.png",
    crankshaft:"/assets/v4_engine/crankshaft.png",
    piston01:"/assets/v4_engine/piston.png",
    piston_pin01:"/assets/v4_engine/piston_pin.png",
    connecting_rod01:"/assets/v4_engine/connecting_rod.png",
    connecting_rod02:"/assets/v4_engine/connecting_rod.png",
    connecting_rod03:"/assets/v4_engine/connecting_rod.png",
    connecting_rod_cap02:"/assets/v4_engine/connecting_rod_cap.png",
    connecting_rod_cap03:"/assets/v4_engine/connecting_rod_cap.png",
    connecting_rod_cap04:"/assets/v4_engine/connecting_rod_cap.png",
    piston02:"/assets/v4_engine/piston.png",
    piston03:"/assets/v4_engine/piston.png",
    piston04:"/assets/v4_engine/piston.png",
    piston_pin02:"/assets/v4_engine/piston_pin.png",
    piston_pin03:"/assets/v4_engine/piston_pin.png",
    piston_pin04:"/assets/v4_engine/piston_pin.png",
    piston_ring01:"/assets/v4_engine/piston_ring.png",
    piston_ring02:"/assets/v4_engine/piston_ring.png",
    piston_ring03:"/assets/v4_engine/piston_ring.png",
    piston_ring04:"/assets/v4_engine/piston_ring.png",
    piston_ring05:"/assets/v4_engine/piston_ring.png",
    piston_ring06:"/assets/v4_engine/piston_ring.png",
    piston_ring07:"/assets/v4_engine/piston_ring.png",
    piston_ring08:"/assets/v4_engine/piston_ring.png",
    piston_ring09:"/assets/v4_engine/piston_ring.png",
    piston_ring10:"/assets/v4_engine/piston_ring.png",
    piston_ring11:"/assets/v4_engine/piston_ring.png",
    piston_ring12:"/assets/v4_engine/piston_ring.png",

  },
  Robot_Gripper:{
    base_gear:"/assets/robot_gripper/base_gear.png",
    base_mounting_bracket:"/assets/robot_gripper/base_mounting_bracket.png",
    base_plate:"/assets/robot_gripper/base_plate.png",
    red_gear_link:"/assets/robot_gripper/gear_link_1.png",
    orange_gear_link:"/assets/robot_gripper/gear_link_2.png",
    left_gripper:"/assets/robot_gripper/gripper.png",
    left_link:"/assets/robot_gripper/link.png",
    right_gripper:"/assets/robot_gripper/gripper.png",
    right_link:"/assets/robot_gripper/link.png",
    pin001:"/assets/robot_gripper/pin.png",
    pin002:"/assets/robot_gripper/pin.png",
    pin004:"/assets/robot_gripper/pin.png",
    pin003:"/assets/robot_gripper/pin.png",
    pin007:"/assets/robot_gripper/pin.png",
    pin008:"/assets/robot_gripper/pin.png",
    pin006:"/assets/robot_gripper/pin.png",
    pin005:"/assets/robot_gripper/pin.png",
    pin010:"/assets/robot_gripper/pin.png",
    pin009:"/assets/robot_gripper/pin.png",
  },
  Drone:{
    arm_gear01:"/assets/drone/arm_gear.png",
    beater_disc01:"/assets/drone/beater_disc.png",
    gearing01:"/assets/drone/gearing.png",
    impellar_blade01:"/assets/drone/impellar_blade.png",
    leg01:"/assets/drone/leg.png",
    main_frame01:"/assets/drone/main_frame.png",
    main_frame02:"/assets/drone/main_frame_mir.png",
    screw04:"/assets/drone/screw.png",
    leg03:"/assets/drone/leg.png",
    impellar_blade03:"/assets/drone/impellar_blade.png",
    gearing03:"/assets/drone/gearing.png",
    arm_gear03:"/assets/drone/arm_gear.png",
    leg02:"/assets/drone/leg.png",
    impellar_blade02:"/assets/drone/impellar_blade.png",
    gearing02:"/assets/drone/gearing.png",
    arm_gear02:"/assets/drone/arm_gear.png",
    arm_gear04:"/assets/drone/arm_gear.png",
    gearing04:"/assets/drone/gearing.png",
    impellar_blade04:"/assets/drone/impellar_blade.png",
    leg04:"/assets/drone/leg.png",
    nut04:"/assets/drone/drone_nut.png",
    screw01:"/assets/drone/screw.png",
    nut01:"/assets/drone/drone_nut.png",
    screw03:"/assets/drone/screw.png",
    nut03:"/assets/drone/drone_nut.png",
    screw02:"/assets/drone/screw.png",
    nut02:"/assets/drone/drone_nut.png",
  },

  Leaf_Spring:{
    clamp_center:"/assets/leaf_spring/clamp_center.png",
    clamp_primary002:"/assets/leaf_spring/clamp_primary.png",
    clamp_secondary002:"/assets/leaf_spring/clamp_secondary.png",
    leaf_layer:"/assets/leaf_spring/leaf_layer.png",
    support002:"/assets/leaf_spring/support.png",
    support_chassis_rigid:"/assets/leaf_spring/support_chassis_rigid.png",
    support_chassis:"/assets/leaf_spring/support_chassis.png",
    support_rubber_60mm002:"/assets/leaf_spring/support_rubber.png",
    clamp_primary001:"/assets/leaf_spring/clamp_primary.png",
    clamp_secondary001:"/assets/leaf_spring/clamp_secondary.png",
    support001:"/assets/leaf_spring/support.png",
    support_rubber_60mm001:"/assets/leaf_spring/support_rubber.png",
  },

};

/* ════════════════════════════════════════════ */
/* 부품 SVG 아이콘들 (기존 디자인 유지)           */
/* ════════════════════════════════════════════ */
const PartFan = () => (
  <svg viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="18" fill="#1a2a3a" stroke="#3a6a8a" strokeWidth="1" />
    {Array.from({ length: 10 }).map((_, i) => {
      const a = (i / 10) * 360,
        r = (a * Math.PI) / 180;
      return (
        <line
          key={i}
          x1={20 + 3 * Math.cos(r)}
          y1={20 + 3 * Math.sin(r)}
          x2={20 + 14 * Math.cos(r)}
          y2={20 + 14 * Math.sin(r)}
          stroke="#7dd3e0"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      );
    })}
    <circle cx="20" cy="20" r="3.5" fill="#00e5ff" />
  </svg>
);
const PartCompressor = () => (
  <svg viewBox="0 0 40 40" fill="none">
    <rect x="4" y="10" width="10" height="20" rx="2" fill="#4a8aaa" opacity="0.7" />
    <rect x="15" y="8" width="10" height="24" rx="2" fill="#5aaac4" opacity="0.8" />
    <rect x="26" y="6" width="10" height="28" rx="2" fill="#7dd3e0" />
    <line x1="4" y1="20" x2="36" y2="20" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
  </svg>
);
const PartCombustor = () => (
  <svg viewBox="0 0 40 40" fill="none">
    <ellipse cx="20" cy="22" rx="12" ry="14" fill="#1a2a3a" stroke="#6a4a2a" strokeWidth="1" />
    <ellipse cx="20" cy="24" rx="7" ry="8" fill="#ff8844" opacity="0.7" />
    <ellipse cx="20" cy="25" rx="4" ry="5" fill="#ffcc44" opacity="0.85" />
    <ellipse cx="20" cy="26" rx="2" ry="3" fill="#fff3c0" />
  </svg>
);
const PartTurbine = () => (
  <svg viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="16" fill="#1a2a3a" stroke="#8a6aaa" strokeWidth="1" />
    {Array.from({ length: 8 }).map((_, i) => {
      const a = (i / 8) * 360 + 10,
        r = (a * Math.PI) / 180;
      return (
        <path
          key={i}
          d={`M${20 + 3 * Math.cos(r)},${20 + 3 * Math.sin(r)} Q${20 + 9 * Math.cos(r + 0.3)},${20 + 9 * Math.sin(r + 0.3)
            } ${20 + 13 * Math.cos(r)},${20 + 13 * Math.sin(r)}`}
          stroke="#a88bd4"
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
        />
      );
    })}
    <circle cx="20" cy="20" r="3" fill="#c4a8f0" />
  </svg>
);
const PartNozzle = () => (
  <svg viewBox="0 0 40 40" fill="none">
    <path d="M8,12 L28,8 L32,20 L28,32 L8,28 Z" fill="#2a4060" stroke="#5a8aaa" strokeWidth="1" />
    <path d="M28,12 L36,14 L36,26 L28,28" fill="#1a3050" stroke="#4a7a8a" strokeWidth="0.8" />
    <ellipse cx="37" cy="20" rx="4" ry="3" fill="#ffaa44" opacity="0.6" />
    <ellipse cx="39" cy="20" rx="2" ry="1.5" fill="#fff3c0" opacity="0.7" />
  </svg>
);
const PartCase = () => (
  <svg viewBox="0 0 40 40" fill="none">
    <ellipse cx="20" cy="20" rx="14" ry="17" fill="#1e3550" stroke="#4a7a9a" strokeWidth="1.2" />
    <ellipse cx="20" cy="20" rx="5" ry="6" fill="#0a1520" stroke="#2a5570" strokeWidth="0.8" />
    <path d="M6,20 L2,20" stroke="#5abcd0" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="2" cy="20" r="2" fill="#2a4a6a" stroke="#5abcd0" strokeWidth="0.8" />
  </svg>
);
const PART_ICONS = [PartFan, PartCompressor, PartCombustor, PartTurbine, PartNozzle, PartCase];

/* 3D 뷰어 대체 SVG */
const ViewerEngineSVG = () => (
  <svg viewBox="0 0 380 300" fill="none">
    <circle cx="190" cy="150" r="50" fill="#4a7a9a" />
    <text x="190" y="160" textAnchor="middle" fill="#fff" fontSize="16">
      3D 뷰어
    </text>
  </svg>
);

/* ════════════════════════════════════════════ */
/* LearnPage                                   */
/* ════════════════════════════════════════════ */
export default function LearnPage({ onHome, onStudy, selectedModel, onLab, onTest, onBack }) {
  const [activeNav, setActiveNav] = useState("Study");
  const [activeTab, setActiveTab] = useState("조립품");

  /* DB 데이터 상태 */
  const [fullModel, setFullModel] = useState(selectedModel || {});
  const [parts, setParts] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [memos, setMemos] = useState([]);

  /* 로딩/에러 상태 */
  const [partsLoading, setPartsLoading] = useState(false);
  const [partsErr, setPartsErr] = useState("");

  /* UI 상태 */
  const [selectedPartKey, setSelectedPartKey] = useState(null);
  const [assemblyProgress, setAssemblyProgress] = useState(0); 
  const [showInfoPanel, setShowInfoPanel] = useState(true);
  const [showProductPanel, setShowProductPanel] = useState(true);
  const [expandedMemo, setExpandedMemo] = useState(null);

  /* 퀴즈 상태 */
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizSelected, setQuizSelected] = useState(null);
  const [quizResults, setQuizResults] = useState([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);

  /* AI 채팅 */
  const [chatMsgs, setChatMsgs] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatBottomRef = useRef(null);

  /*부품 썸네일*/
  const currentThumbMap =
  PART_THUMBS_BY_MODEL[selectedModel?.title] || {};

  const navItems = ["Home", "Study", "CAD", "Lab", "Test"];
  const tabs = ["조립품", "퀴즈"];

  /* 드래그 스크롤 (메모장) */
  const scrollRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  // 3D 뷰어 제어용 ref
  const viewerRef = useRef(null);

  // 초기화 버튼 핸들러
  const handleReset = () => {
    setAssemblyProgress(0);      // 조립 상태로 복귀
    setSelectedPartKey(null);    // 부품 선택 해제
    setShowOutlines(false);      // 윤곽선 끄기
    setShowProductPanel(true);   // 모델 개요 패널 다시 보이기
    setShowInfoPanel(true);      // 부품 설명 패널 다시 보이기

    // 3D 뷰어(카메라/줌) 초기화
    if (viewerRef.current) {
      viewerRef.current.resetView();
    }
  };

  /* [추가] 윤곽선 토글 상태 */
  const [showOutlines, setShowOutlines] = useState(false);

  const onMouseDown = useCallback((e) => {
    if (e.target.tagName === "TEXTAREA") return;
    isDragging.current = true;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeft.current = scrollRef.current.scrollLeft;
  }, []);
  const onMouseLeave = useCallback(() => { isDragging.current = false; }, []);
  const onMouseUp = useCallback(() => { isDragging.current = false; }, []);
  const onMouseMove = useCallback((e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    scrollRef.current.scrollLeft = scrollLeft.current - (e.pageX - scrollRef.current.offsetLeft - startX.current);
  }, []);

  /* 초기 데이터 로드 */
  useEffect(() => {
    if (!selectedModel?.id) return;

    // 헤더 정의
    const headers = { "X-User-ID": getUserId() };

    // 1. 모델 상세 정보 가져오기
    fetch(`/api/models/${selectedModel.id}`, { headers })
      .then(res => res.ok ? res.json() : {})
      .then(data => setFullModel(prev => ({ ...prev, ...data })))
      .catch(err => console.error("모델 정보 로드 실패:", err));

    // 2. 부품 목록 가져오기
    setPartsLoading(true);
    setPartsErr("");
    fetch(`/api/models/${selectedModel.id}/parts`, { headers })
      .then(res => res.json())
      .then(data => {
        const loadedParts = Array.isArray(data) ? data : [];
        setParts(loadedParts);

         // 이 위치에 추가
  console.log("지금 모델:", selectedModel?.title);
  console.log("부품 meshName:", loadedParts.map(p => p.meshName));

        // 첫 부품 자동 선택
        if (loadedParts.length > 0) setSelectedPartKey(getPartKey(loadedParts[0]));
      })
      .catch(e => {
        setPartsErr("부품 로드 실패");
        setParts([]);
      })
      .finally(() => setPartsLoading(false));

    // 3. 퀴즈 목록 가져오기
    fetch(`/api/models/${selectedModel.id}/quizzes`, { headers })
      .then(res => res.json())
      .then(data => setQuizzes(Array.isArray(data) ? data : []))
      .catch(err => console.error("퀴즈 로드 실패:", err));

    // 4. 메모 목록 가져오기 (사용자별)
    fetch(`/api/models/${selectedModel.id}/memos`, { headers })
      .then(res => res.json())
      .then(data => setMemos(Array.isArray(data) ? data : []))
      .catch(err => console.error("메모 로드 실패:", err));

    // 대화 내역 로드 (사용자별)
    fetch(`/api/ai/history/${selectedModel.id}`, { headers })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        // DB: [{question, answer}, ...] -> UI: [{role, text}, ...] 변환
        const history = [];
        if (data.length === 0) {
          history.push({ role: "ai", text: "안녕하세요! 궁금한 점이 있으신가요?" });
        } else {
          data.forEach(item => {
            history.push({ role: "user", text: item.question });
            history.push({ role: "ai", text: item.answer });
          });
        }
        setChatMsgs(history);
      })
      .catch(err => {
        console.error("대화 내역 로드 실패:", err);
        setChatMsgs([{ role: "ai", text: "안녕하세요! (이전 대화 로드 실패)" }]);
      });

  }, [selectedModel]);

  /* 메모 CRUD */
  const addMemo = async () => {
    if (!selectedModel?.id) return;
    try {
      const res = await fetch(`/api/models/${selectedModel.id}/memos`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-User-ID": getUserId() // 헤더 추가
        },
        body: JSON.stringify({ title: "", content: "" })
      });
      if (res.ok) {
        const newMemo = await res.json();
        setMemos(prev => [...prev, newMemo]);
      }
    } catch (e) { console.error("메모 추가 실패", e); }
  };

  const updateMemoLocal = (idx, field, val) => {
    setMemos(prev => prev.map((m, i) => (i === idx ? { ...m, [field]: val } : m)));
  };

  const saveMemoToDb = async (memo) => {
    if (!memo.id) return;
    try {
      await fetch(`/api/memos/${memo.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "X-User-ID": getUserId() // 헤더 추가
        },
        body: JSON.stringify({ title: memo.title, content: memo.content })
      });
    } catch (e) { console.error("메모 저장 실패", e); }
  };

  const deleteMemo = async (idx) => {
    const target = memos[idx];
    if (target.id) {
      try {
        await fetch(`/api/memos/${target.id}`, { 
          method: "DELETE",
          headers: { "X-User-ID": getUserId() } // 헤더 추가
        });
      } catch (e) { console.error("메모 삭제 실패", e); }
    }
    setMemos(prev => prev.filter((_, i) => i !== idx));
    if (expandedMemo === idx) setExpandedMemo(null);
  };

  /* 퀴즈 로직 */
  const resetQuiz = () => {
    setQuizIdx(0);
    setQuizSelected(null);
    setQuizResults([]);
    setQuizSubmitted(false);
    setQuizFinished(false);
  };
  const handleTabClick = (t) => {
    setActiveTab(t);
    if (t === "퀴즈") resetQuiz();
  };

  const submitQuiz = () => {
    if (!quizzes[quizIdx]) return;
    setQuizSubmitted(true);
    const correct = quizzes[quizIdx].answer === quizSelected;
    setQuizResults((prev) => [...prev, { question: quizzes[quizIdx].question, correct }]);
  };
  const nextQuestion = () => {
    if (quizIdx < quizzes.length - 1) {
      setQuizIdx(quizIdx + 1);
      setQuizSelected(null);
      setQuizSubmitted(false);
    } else {
      setQuizFinished(true);
    }
  };

  const handleNav = (item) => {
    if (item === "CAD") { alert("페이지 준비중입니다"); return; }
    setActiveNav(item);
    if (item === "Home") onHome();
    if (item === "Study") onStudy();
    if (item === "Lab") onLab?.();
    if (item === "Test") onTest?.();
  };

  /* 헬퍼 함수 */
  const getPartKey = (part) => {
    if (part?.id) return `id:${part.id}`;
    if (part?.meshName) return `mesh:${part.meshName}`;
    return null;
  };
  const selectedPart = parts.find((p) => getPartKey(p) === selectedPartKey) || parts[0] || null;

  /* modelUrl 정규화 */
  const normalizeModelUrl = (selectedModel) => {
    if (!selectedModel?.modelUrl) return null;
    let modelUrl = selectedModel.modelUrl;
    const safeTitle = selectedModel.title.replace(/ /g, "_");
    let result;
    if (modelUrl.includes("%20")) {
      modelUrl = decodeURIComponent(modelUrl).replace(/ /g, "_");
    }
    if (modelUrl.startsWith("/") || modelUrl.startsWith("http")) {
      result = modelUrl;
      if (result.endsWith("/")) result = `${result}${safeTitle}.glb`;
    } else {
      result = `/assets/3d/${safeTitle}/${modelUrl}`;
    }
    return result;
  };

  /* 채팅 스크롤 */
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMsgs, isAiLoading]);

  /* AI 요청 로직 */
  const sendChat = async () => {
    const question = chatInput.trim();
    if (!question || isAiLoading) return;

    setChatInput("");
    setChatMsgs((prev) => [...prev, { role: "user", text: question }]);
    setIsAiLoading(true);

    try {
      if (!selectedModel?.id) throw new Error("선택된 모델이 없습니다.");
      const meshName = selectedPart?.meshName || selectedModel?.title || null;

      const notesObj = {
        model: { id: selectedModel.id, title: selectedModel.title },
        part: selectedPart ? { name: selectedPart.meshName, ...selectedPart.content } : null,
      };

      const payload = {
        modelId: selectedModel.id,
        meshName,
        question,
        notes: JSON.stringify(notesObj),
      };

      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-User-ID": getUserId() // 헤더 추가
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const answer = data.answer || data.message || "응답 없음";

      setChatMsgs((prev) => [...prev, { role: "ai", text: answer }]);
    } catch (err) {
      setChatMsgs((prev) => [...prev, { role: "ai", text: `오류: ${err.message}` }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handlePartSelect = (part) => {
    setSelectedPartKey(getPartKey(part));
  };
  
  /* PDF 리포트 생성 */
  const generatePdfReport = async () => {

    if (!window.jspdf || !window.html2canvas) {
      alert("PDF 생성 라이브러리가 로드되지 않았습니다.");
      return;
    }

    const reportElement = document.getElementById("hidden-pdf-report");
    const viewerElement = document.querySelector(".viewer-3d");

    if (!reportElement || !viewerElement) {
      alert("리포트 생성을 위한 요소를 찾을 수 없습니다.");
      return;
    }

    const btn = document.querySelector(".pdf-report-btn");
    if (btn) btn.innerText = "이미지 캡처 중...";

    try {
      // 1. 3D 뷰어 화면 캡처
      const screenCanvas = await window.html2canvas(viewerElement, {
        useCORS: true,
        backgroundColor: "#151e2a"
      });
      const screenImgData = screenCanvas.toDataURL("image/png");

      // 2. 캡처한 이미지를 리포트 템플릿에 넣기
      const reportImgTag = document.getElementById("report-screenshot-img");
      if (reportImgTag) {
        reportImgTag.src = screenImgData;
      }

      await new Promise((resolve) => setTimeout(resolve, 300));

      if (btn) btn.innerText = "PDF 생성 중...";

      // 3. 리포트 전체 캡처 및 PDF 생성
      const canvas = await window.html2canvas(reportElement, {
        scale: 2, 
        useCORS: true,
        backgroundColor: "#ffffff"
      });

      const imgData = canvas.toDataURL("image/png");
      const { jsPDF } = window.jspdf;

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      const doc = new jsPDF('p', 'mm', 'a4');

      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight; 
        doc.addPage();
        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      doc.save(`SIMVEX_Report_${selectedModel?.title || "Study"}.pdf`);

    } catch (err) {
      console.error("PDF 생성 실패:", err);
      alert(`오류 발생: ${err.message}`);
    } finally {
      if (btn) btn.innerText = "PDF 리포트 생성";
    }
  };

  /* 부품 상세 렌더링 */
  const renderPartDetail = () => {
    if (!selectedPart || !selectedPart.content) {
      return <div className="viewer-no-data" style={{ color: "#aaa", padding: "20px" }}>부품 정보가 없습니다.</div>;
    }

    const { description, function: func, material, structure } = selectedPart.content;

    return (
      <div className="viewer-part-detail-new">
        <div className="part-section-header" style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "15px", color: "#fff" }}>
          {selectedPart.meshName}
        </div>
        {description && (<div className="part-section"><div className="part-section-title">개요</div><div className="part-section-content">{description}</div></div>)}
        {func && (<div className="part-section"><div className="part-section-title">기능</div><div className="part-section-content">{func}</div></div>)}
        {structure && (<div className="part-section"><div className="part-section-title">구조</div><div className="part-section-content">{structure}</div></div>)}
        {material && (<div className="part-section"><div className="part-section-title">재질</div><div className="part-section-content">{material}</div></div>)}
      </div>
    );
  };

  return (
    <>
      <div className="noise-overlay" />
      <div className="ambient-glow glow-1" />
      <div className="ambient-glow glow-2" />

      <div className="page-wrapper">
        {/* 상단 내비게이션 */}
        <nav className="nav">
          <div className="inner">
            <div className="nav-logo" onClick={onHome}>

              <span className="nav-logo-text">SIMVEX</span>
            </div>
            <div className="nav-links">
              {navItems.map((item) => (
                <button key={item} className={`nav-link${activeNav === item ? " active" : ""}`} onClick={() => handleNav(item)}>
                  {item}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* LEARN BODY */}
        <section className="learn-body">
          <div className="inner">
            {/* 상단: 탭 + PDF 버튼 */}
            <div className="learn-header-row">
              <div className="learn-tabs-wrap">
                <button className="learn-back-btn" onClick={onBack} title="뒤로가기">‹</button>
                <div className="learn-tabs">
                  {tabs.map((t) => (
                    <button key={t} className={`learn-tab${activeTab === t ? " active" : ""}`} onClick={() => handleTabClick(t)}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <button className="pdf-report-btn" onClick={generatePdfReport}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 2v12M12 2v12M2 8h12" strokeLinecap="round" />
                  <rect x="3" y="1" width="10" height="14" rx="1" fill="none" />
                </svg>
                PDF 리포트 생성
              </button>
            </div>

            <div className="learn-content-row">
              <div className="viewer-panel">
                {activeTab === "퀴즈" ? (
                  <div className="quiz-container">
                    {quizzes.length === 0 ? (
                      <div style={{ color: "#fff", padding: "40px", textAlign: "center" }}>등록된 퀴즈가 없습니다.</div>
                    ) : !quizFinished ? (
                      <>
                        <div className="quiz-header">
                          <h2 className="quiz-main-title">{fullModel.title} 퀴즈</h2>
                          <div className="quiz-progress">
                            <div className="quiz-progress-bar">
                              <div className="quiz-progress-fill" style={{ width: `${((quizIdx + 1) / quizzes.length) * 100}%` }} />
                            </div>
                            <div className="quiz-progress-text">{quizIdx + 1}/{quizzes.length}</div>
                          </div>
                        </div>

                        <div className="quiz-question-section">
                          <div className="quiz-question">{quizzes[quizIdx].question}</div>
                        </div>

                        <div className="quiz-options-grid">
                          {quizzes[quizIdx].options.map((opt, i) => {
                            let optionClass = "quiz-option-new";
                            if (quizSubmitted) {
                              if (i === quizzes[quizIdx].answer) optionClass += " correct";
                              else if (i === quizSelected) optionClass += " wrong";
                            } else if (quizSelected === i) {
                              optionClass += " selected";
                            }
                            return (
                              <button key={i} className={optionClass} onClick={() => !quizSubmitted && setQuizSelected(i)} disabled={quizSubmitted}>
                                <span className="quiz-option-number">{i + 1}.</span>
                                <span className="quiz-option-text">{opt}</span>
                              </button>
                            );
                          })}
                        </div>

                        <div className="quiz-feedback">
                          {quizSubmitted && (
                            <div className={`quiz-feedback-box ${quizResults[quizResults.length - 1].correct ? "correct" : "wrong"}`}>
                              {quizResults[quizResults.length - 1].correct
                                ? `✓ 정답! ${quizzes[quizIdx].explanation || ""}`
                                : `✗ 오답. 정답은 ${quizzes[quizIdx].options[quizzes[quizIdx].answer]}입니다. ${quizzes[quizIdx].explanation || ""}`
                              }
                            </div>
                          )}
                        </div>

                        <div className="quiz-actions">
                          <button className="quiz-btn-secondary" onClick={resetQuiz}>처음으로</button>
                          {!quizSubmitted ? (
                            <button className="quiz-btn-primary" onClick={submitQuiz} disabled={quizSelected === null}>정답 확인</button>
                          ) : (
                            <button className="quiz-btn-primary" onClick={nextQuestion}>
                              {quizIdx < quizzes.length - 1 ? "다음 문제" : "결과 보기"}
                            </button>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="quiz-final-result">
                        <div className="quiz-final-title">퀴즈 완료!</div>
                        <div className="quiz-final-score">
                          <span className="quiz-score-big">{quizResults.filter((r) => r.correct).length}</span>
                          <span className="quiz-score-divider">/</span>
                          <span className="quiz-score-total">{quizzes.length}</span>
                        </div>
                        <div className="quiz-final-message">
                          {quizResults.filter((r) => r.correct).length === quizzes.length
                            ? "완벽합니다!"
                            : quizResults.filter((r) => r.correct).length >= quizzes.length * 0.6
                              ? "잘하셨습니다!"
                              : "다시 도전해보세요!"
                          }
                        </div>
                        <button className="quiz-btn-restart" onClick={resetQuiz}>다시 풀기</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="viewer-body-row">
                    {/* 왼쪽 토글 (모델 개요) */}
                    {!showProductPanel && (
                      <button className="viewer-toggle-btn-side left" onClick={() => setShowProductPanel(true)} title="모델 개요 보기">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 2l6 6-6 6" />
                        </svg>
                      </button>
                    )}

                    {/* 좌측: 모델 개요 (DB 연동 + AI 요약 제거) */}
                    {showProductPanel && (
                      <div className="viewer-product">
                        <div className="viewer-product-header">
                          <div className="viewer-product-title">모델 개요</div>
                          <button className="viewer-info-close" onClick={() => setShowProductPanel(false)}>✕</button>
                        </div>
                        <div className="viewer-product-body">
                          <div className="viewer-product-model-title">{fullModel.title || selectedModel.title}</div>
                          <div className="viewer-info-product-desc">
                            {fullModel.description ? fullModel.description : (fullModel.modelUrl ? `파일: ${fullModel.modelUrl}` : "설명 정보가 없습니다.")}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 중앙: 3D 뷰어 */}
                    <div className={`viewer-3d${(!showInfoPanel || !showProductPanel) ? " expanded" : ""}`}>
                      <div className="viewer-3d-inner">

                        {/* 버튼들을 감싸는 컨테이너 */}
                        <div className="viewer-controls-top-left" style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10, display: 'flex', gap: '10px' }}>

                          {/* 윤곽선 토글 버튼 */}
                          <button
                            className={`viewer-help-btn ${showOutlines ? "active" : ""}`}
                            onClick={() => setShowOutlines(!showOutlines)}
                            title="부품 윤곽선 보기/숨기기"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={showOutlines ? "#00e5ff" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                              <line x1="12" y1="22.08" x2="12" y2="12"></line>
                            </svg>
                          </button>

                          {/* 새로고침 버튼 */}
                          <button className="viewer-help-btn"
                            title="새로고침"
                            onClick={handleReset}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="23 4 23 10 17 10"></polyline>
                              <polyline points="1 20 1 14 7 14"></polyline>
                              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                            </svg>
                          </button>

                          {/* 도움말 버튼 */}
                          <div className="viewer-help">
                            <button
                              className="viewer-help-btn"
                              type="button"
                              aria-label="3D 뷰어 사용법"
                            >
                              ?
                            </button>
                            <div className="viewer-help-tooltip">
                              <div className="viewer-help-title">3D 뷰어 사용법</div>
                              <div className="viewer-help-line">좌클릭 : 화면 회전</div>
                              <div className="viewer-help-line">우클릭 : 화면 이동</div>
                              <div className="viewer-help-line">휠 : 줌 인/아웃</div>
                            </div>
                          </div>

                        </div>

                        {selectedModel?.modelUrl ? (
                          <ThreeViewer
                            ref={viewerRef} 
                            modelUrl={normalizeModelUrl(selectedModel)}
                            parts={parts}
                            selectedPartKey={selectedPartKey}
                            assemblyProgress={assemblyProgress}
                            onPartClick={handlePartSelect}
                            onAssemblyProgressChange={setAssemblyProgress}
                            showOutlines={showOutlines}
                          />
                        ) : (
                          <ViewerEngineSVG />
                        )}
                      </div>
                    </div>

                    {/* 조립/분해 슬라이더 */}
                    <div className="assembly-slider-container">
                      <div className="assembly-slider-label">조립 및 분해</div>
                      <div className="assembly-slider-track">
                        <input
                          type="range" min="0" max="100"
                          value={assemblyProgress}
                          onChange={(e) => setAssemblyProgress(Number(e.target.value))}
                          className="assembly-slider"
                        />
                        <div className="assembly-slider-markers">
                          <span className="assembly-slider-marker-label">조립</span>
                          <span className="assembly-slider-marker-label">분해</span>
                        </div>
                      </div>
                    </div>

                    {/* 우측: 부품 설명 (DB 연동) */}
                    {showInfoPanel && (
                      <div className="viewer-info">
                        <div className="viewer-info-header">
                          <div className="viewer-info-title">부품 설명</div>
                          <button className="viewer-info-close" onClick={() => setShowInfoPanel(false)}>✕</button>
                        </div>

                        {partsLoading && <div className="viewer-parts-status">불러오는 중…</div>}
                        {partsErr && <div className="viewer-parts-status error">오류: {partsErr}</div>}

                        {!partsLoading && !partsErr && (
                          <div className="viewer-info-scroll">
                            {parts.length > 0 && (
                              <div className="viewer-parts-grid">
                                {parts.map((part) => {
                                  const partKey = getPartKey(part);
                                  const isActive = partKey === selectedPartKey;

                                  const key = normalizeMeshKey(part.meshName);
                                  const src =
                                    currentThumbMap[key] ||
                                    currentThumbMap["base"] || // Suspension 기본
                                    "/assets/suspension/base.png"; // 최후 fallback

                                  return (
                                    <div
                                      key={partKey}
                                      className={`viewer-part-thumb${isActive ? " active" : ""}`}
                                      onClick={() => handlePartSelect(part)}
                                      title={part.meshName}
                                    >
                                      <img
                                        src={src}
                                        alt={part.meshName}
                                        style={{
                                          width: "100%",
                                          height: "100%",
                                          objectFit: "contain",
                                        }}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            {/* 상세 정보 */}
                            {renderPartDetail()}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 오른쪽 토글 */}
                    {!showInfoPanel && (
                      <button className="viewer-toggle-btn-side right" onClick={() => setShowInfoPanel(true)} title="부품 설명 보기">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10 2L4 8l6 6" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* ═══ 오른쪽: AI + 메모장 (DB 연동) ═══ */}
              <div className="right-panel">
                <div className="ai-card">
                  <div className="ai-card-header">
                    <div className="ai-card-title">
                      <span className="ai-status-dot" />
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="ai-sparkle-icon">
                        <path d="M8 1l1.8 4.2L14 7l-4.2 1.8L8 13l-1.8-4.2L2 7l4.2-1.8z" fill="#00e5ff" opacity="0.85" />
                      </svg>
                      AI 어시스턴트
                    </div>
                    <span className="ai-active-badge">{isAiLoading ? "답변 생성 중..." : "Active"}</span>
                  </div>
                  <div className="ai-chat-body">
                    {chatMsgs.map((msg, i) => (
                      <div key={i} className={`ai-chat-msg ${msg.role}`}>
                        <div className="ai-chat-bubble">{msg.text}</div>
                      </div>
                    ))}
                    {isAiLoading && <div className="ai-chat-msg ai"><div className="ai-chat-bubble">...</div></div>}
                    <div ref={chatBottomRef} />
                  </div>
                </div>

                <div className="memo-card">
                  <div className="memo-header">
                    <button className="memo-header-note-tab">Note</button>
                    <button className="memo-header-add" onClick={addMemo}>+</button>
                  </div>
                  <div
                    className="memo-notes-scroll"
                    ref={scrollRef}
                    onMouseDown={onMouseDown}
                    onMouseLeave={onMouseLeave}
                    onMouseUp={onMouseUp}
                    onMouseMove={onMouseMove}
                  >
                    {memos.map((memo, idx) => (
                      <div key={idx} className="memo-note">
                        <div className="memo-note-top">
                          <span className="memo-note-label">Memo #{idx + 1}</span>
                          <div className="memo-note-actions">
                            <button className="memo-note-expand" onClick={() => setExpandedMemo(idx)}>↗</button>
                            <button className="memo-note-delete" onClick={() => deleteMemo(idx)}>×</button>
                          </div>
                        </div>
                        <div className="memo-note-body">
                          <textarea
                            className="memo-note-title-input"
                            placeholder="제목..."
                            value={memo.title || ""}
                            onChange={(e) => updateMemoLocal(idx, "title", e.target.value)}
                            onBlur={() => saveMemoToDb(memo)}
                            rows={1}
                          />
                          <div className="memo-note-divider" />
                          <textarea
                            className="memo-note-content-input"
                            placeholder="내용..."
                            value={memo.content || ""}
                            onChange={(e) => updateMemoLocal(idx, "content", e.target.value)}
                            onBlur={() => saveMemoToDb(memo)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 입력 바 */}
            <div className="learn-input-bar">
              <div className="learn-input-label">무엇이 궁금하신가요?</div>
              <div className="learn-input-wrap">
                <div className="learn-input-plus">+</div>
                <input
                  className="learn-input-field"
                  type="text"
                  placeholder="질문을 입력하세요..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChat()}
                  disabled={isAiLoading}
                />
              </div>
              <button className="learn-send-btn" onClick={sendChat} disabled={isAiLoading}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2L7 9M14 2l-4 12-3-5-5-3 12-4z" />
                </svg>
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* 메모 확장 모달 */}
      {expandedMemo !== null && memos[expandedMemo] && (
        <div className="memo-modal-overlay" onClick={() => setExpandedMemo(null)}>
          <div className="memo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="memo-modal-header">
              <span className="memo-modal-label">Memo #{expandedMemo + 1}</span>
              <div className="memo-modal-header-actions">
                <button className="memo-modal-delete" onClick={() => deleteMemo(expandedMemo)}>삭제</button>
                <button className="memo-modal-close" onClick={() => setExpandedMemo(null)}>✕</button>
              </div>
            </div>
            <textarea
              className="memo-modal-title"
              placeholder="제목..."
              value={memos[expandedMemo].title || ""}
              onChange={(e) => updateMemoLocal(expandedMemo, "title", e.target.value)}
              onBlur={() => saveMemoToDb(memos[expandedMemo])}
            />
            <div className="memo-modal-divider" />
            <textarea
              className="memo-modal-content"
              placeholder="내용..."
              value={memos[expandedMemo].content || ""}
              onChange={(e) => updateMemoLocal(expandedMemo, "content", e.target.value)}
              onBlur={() => saveMemoToDb(memos[expandedMemo])}
            />
          </div>
        </div>
      )}

      {/* PDF 생성용 숨겨진 리포트 템플릿 */}
      <div
        id="hidden-pdf-report"
        style={{
          position: "absolute",
          top: "-10000px",
          left: "-10000px",
          width: "210mm",
          minHeight: "297mm", // A4
          padding: "20mm",
          backgroundColor: "#ffffff",
          color: "#24292f", 
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
          zIndex: -1,
          boxSizing: "border-box"
        }}
      >
        <div style={{ marginBottom: "30px", borderBottom: "1px solid #d0d7de", paddingBottom: "10px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: "600", margin: "0 0 10px 0" }}>
            {fullModel?.title || selectedModel?.title || "Untitled Model"}
          </h1>
          <div style={{ fontSize: "14px", color: "#57606a" }}>
            Simvex Report generated on {new Date().toLocaleDateString()}
          </div>
        </div>

        <div style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: "600", borderBottom: "1px solid #d8dee4", paddingBottom: "0.3em", marginBottom: "16px", marginTop: "24px" }}>
            Photo
          </h2>
          <div style={{ border: "1px solid #d0d7de", borderRadius: "6px", overflow: "hidden", backgroundColor: "#f6f8fa" }}>
            <img id="report-screenshot-img" alt="Model Screenshot" style={{ width: "100%", height: "auto", display: "block" }} />
          </div>
        </div>

        <div style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: "600", borderBottom: "1px solid #d8dee4", paddingBottom: "0.3em", marginBottom: "16px", marginTop: "24px" }}>
            Memo
          </h2>
          {memos.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {memos.map((memo, i) => (
                <div key={i} style={{ border: "1px solid #d0d7de", borderRadius: "6px", padding: "16px", backgroundColor: "#ffffff" }}>
                  <div style={{ fontSize: "16px", fontWeight: "600", marginBottom: "8px", color: "#24292f" }}>
                    {memo.title || "Untitled Note"}
                  </div>
                  <div style={{ fontSize: "14px", lineHeight: "1.5", color: "#24292f", whiteSpace: "pre-wrap" }}>
                    {memo.content || ""}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "#57606a", fontStyle: "italic" }}>No memos written.</p>
          )}
        </div>

        <div style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: "600", borderBottom: "1px solid #d8dee4", paddingBottom: "0.3em", marginBottom: "16px", marginTop: "24px" }}>
            Q&A History
          </h2>
          <div style={{ fontSize: "14px", lineHeight: "1.6", color: "#24292f", backgroundColor: "#ffffff", padding: "5px" }}>
            {chatMsgs.length > 0 ? (
              chatMsgs.map((msg, idx) => (
                <div key={idx} style={{ marginBottom: "15px", paddingBottom: "15px", borderBottom: "1px dashed #d0d7de" }}>
                  <div style={{ fontWeight: "600", color: msg.role === "ai" ? "#0969da" : "#57606a", marginBottom: "4px" }}>
                    {msg.role === "ai" ? "AI Answer" : "User Question"}
                  </div>
                  <div style={{ whiteSpace: "pre-wrap" }}>{msg.text}</div>
                </div>
              ))
            ) : (
              <p style={{ color: "#57606a", fontStyle: "italic" }}>대화 내역이 없습니다.</p>
            )}
          </div>
        </div>

        <div style={{ marginTop: "60px", borderTop: "1px solid #d0d7de", paddingTop: "20px", textAlign: "center", fontSize: "12px", color: "#57606a" }}>
          <span style={{ fontWeight: "600" }}>SIMVEX</span> &copy; 2026
        </div>
      </div>
    </>
  );
}
