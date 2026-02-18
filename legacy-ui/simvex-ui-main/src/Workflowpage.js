import { useState, useRef, useCallback, useEffect } from "react";
import "./Shared.css";
import "./Workflowpage.css";
import { getUserId } from "./utils/auth"; // 새로 만든 auth 유틸 import

/* ════════════════════════════════════════════ */
/* WorkflowPage (Full Code with UUID)           */
/* ════════════════════════════════════════════ */
export default function WorkflowPage({ onHome, onStudy, onTest }) {
  const [activeNav, setActiveNav] = useState("Lab");
  const navItems = ["Home", "Study", "CAD", "Lab", "Test"];

  // API Base URL
  const API_BASE = "/api/workflow";

  // 상태 관리
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);

  // 미리보기 모달 상태
  const [previewFile, setPreviewFile] = useState(null); // { url, type, name }

  // 편집/드래그 상태
  const [editingNode, setEditingNode] = useState(null);
  const [draggingNode, setDraggingNode] = useState(null);
  const [draggingOffset, setDraggingOffset] = useState({ x: 0, y: 0 });

  // 연결선 생성 상태
  const [connectingFrom, setConnectingFrom] = useState(null);
  const [connectingMouse, setConnectingMouse] = useState(null);

  // 줌/팬 상태
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef(null);

  /* ── 초기 데이터 로드 ── */
  const fetchWorkflowData = useCallback(() => {
    fetch(API_BASE, {
      headers: { "X-User-ID": getUserId() } // 헤더 추가
    })
      .then(res => res.json())
      .then(data => {
        const loadedNodes = data.nodes.map(n => ({
          id: n.id,
          x: n.x,
          y: n.y,
          title: n.title,
          content: n.content,
          files: n.files || [] 
        }));
        
        const loadedConns = data.connections.map(c => ({
          id: c.id,
          from: c.from,
          to: c.to,
          fromAnchor: c.fromAnchor,
          toAnchor: c.toAnchor
        }));

        setNodes(loadedNodes);
        setConnections(loadedConns);
      })
      .catch(err => console.error("데이터 로드 실패:", err));
  }, []);

  useEffect(() => {
    fetchWorkflowData();
  }, [fetchWorkflowData]);

  const handleNav = (item) => {
    if (item === "CAD") {
      alert("페이지 준비중입니다");
      return;
    }
    setActiveNav(item);
    if (item === "Home") onHome();
    if (item === "Study") onStudy?.();
    if (item === "Test") onTest?.();
  };

  /* ── 노드 드래그 시작 ── */
  const handleNodeMouseDown = (e, node) => {
    if (e.target.classList.contains("wf-anchor")) return;
    // [중요] 버튼이나 파일 관련 요소 클릭 시 드래그 방지
    if (e.target.closest("button") || e.target.closest(".wf-node-attach") || e.target.closest(".wf-file-row")) return;
    
    e.stopPropagation();
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseY = (e.clientY - rect.top - pan.y) / zoom;
    setDraggingNode(node.id);
    setDraggingOffset({ x: mouseX - node.x, y: mouseY - node.y });
  };

  /* ── 앵커 드래그 (연결선) ── */
  const handleAnchorMouseDown = (e, nodeId, anchor) => {
    e.stopPropagation();
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseY = (e.clientY - rect.top - pan.y) / zoom;
    setConnectingFrom({ nodeId, anchor });
    setConnectingMouse({ x: mouseX, y: mouseY });
  };

  const handleAnchorMouseUp = (e, nodeId, anchor) => {
    if (connectingFrom && connectingFrom.nodeId !== nodeId) {
      const newConn = {
        from: connectingFrom.nodeId,
        to: nodeId,
        fromAnchor: connectingFrom.anchor,
        toAnchor: anchor
      };
      fetch(`${API_BASE}/connections`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-User-ID": getUserId() // 헤더 추가
        },
        body: JSON.stringify(newConn)
      }).then(() => {
        setConnections(prev => [...prev, newConn]);
      });
    }
    setConnectingFrom(null);
    setConnectingMouse(null);
  };

  /* ── 캔버스 마우스 이동 ── */
  const handleCanvasMouseMove = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseY = (e.clientY - rect.top - pan.y) / zoom;

    if (draggingNode !== null) {
      setNodes(prev => prev.map(n =>
        n.id === draggingNode
          ? { ...n, x: mouseX - draggingOffset.x, y: mouseY - draggingOffset.y }
          : n
      ));
    }
    if (connectingFrom) setConnectingMouse({ x: mouseX, y: mouseY });
    if (isPanning) {
      setPan({
        x: pan.x + (e.clientX - panStart.x),
        y: pan.y + (e.clientY - panStart.y)
      });
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }, [draggingNode, draggingOffset, connectingFrom, isPanning, pan, panStart, zoom]);

  /* ── 캔버스 마우스 업 ── */
  const handleCanvasMouseUp = useCallback(() => {
    if (draggingNode !== null) {
      const node = nodes.find(n => n.id === draggingNode);
      if (node) {
        fetch(`${API_BASE}/nodes/${node.id}`, {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            "X-User-ID": getUserId() // 헤더 추가
          },
          body: JSON.stringify({ x: node.x, y: node.y })
        });
      }
    }
    setDraggingNode(null);
    setConnectingFrom(null);
    setConnectingMouse(null);
    setIsPanning(false);
  }, [draggingNode, nodes, connectingFrom]);

  /* ── 줌/팬 ── */
  const handleCanvasWheel = (e) => {
    if (e.target.closest('.wf-node-body')) return;
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const worldX = (mouseX - pan.x) / zoom;
    const worldY = (mouseY - pan.y) / zoom;
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.3, Math.min(3, zoom * delta));
    setZoom(newZoom);
    setPan({ x: mouseX - worldX * newZoom, y: mouseY - worldY * newZoom });
  };

  const handleCanvasMouseDown = (e) => {
    if (e.target === canvasRef.current || e.target.classList.contains("wf-canvas-inner")) {
      
      // [수정됨] 편집 중인 상태에서 바탕화면을 눌렀다면 -> 먼저 저장 실행!
      if (editingNode) {
        const node = nodes.find(n => n.id === editingNode);
        if (node) {
            saveNodeData(node); // 강제 저장
        }
      }

      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      setEditingNode(null); // 그 다음 편집 모드 해제
    }
  };

  /* ── 노드 관리 ── */
  const addNode = () => {
    const newNodeReq = {
      title: "새노드",
      content: "",
      x: 300 + Math.random() * 200 - pan.x / zoom,
      y: 200 + Math.random() * 200 - pan.y / zoom
    };
    fetch(`${API_BASE}/nodes`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-User-ID": getUserId() // 헤더 추가
      },
      body: JSON.stringify(newNodeReq)
    })
    .then(res => res.json())
    .then(newId => {
      setNodes(prev => [...prev, { ...newNodeReq, id: newId, files: [] }]);
    });
  };

  const handleDeleteNode = (e, nodeId) => {
    e.stopPropagation();
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    fetch(`${API_BASE}/nodes/${nodeId}`, { 
      method: "DELETE",
      headers: { "X-User-ID": getUserId() } // 헤더 추가
    })
      .then(res => {
          if(!res.ok) throw new Error("삭제 실패");
          setNodes(prev => prev.filter(n => n.id !== nodeId));
          setConnections(prev => prev.filter(c => c.from !== nodeId && c.to !== nodeId));
          if (editingNode === nodeId) setEditingNode(null);
      })
      .catch(err => alert("삭제 중 오류가 발생했습니다."));
  };

  /* ── 연결선 삭제 ── */
  const handleConnectionClick = (conn) => {
    if(window.confirm('연결을 삭제하시겠습니까?')){
        fetch(`${API_BASE}/connections?from=${conn.from}&to=${conn.to}`, { 
          method: 'DELETE',
          headers: { "X-User-ID": getUserId() } // 헤더 추가
        })
          .then(() => setConnections(prev => prev.filter(c => c.id !== conn.id)));
    }
  };

  /* ── 내용 수정 ── */
  const handleTitleChange = (id, val) => setNodes(prev => prev.map(n => n.id === id ? { ...n, title: val } : n));
  const handleContentChange = (id, val) => setNodes(prev => prev.map(n => n.id === id ? { ...n, content: val } : n));
  const saveNodeData = (node) => {
    fetch(`${API_BASE}/nodes/${node.id}`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "X-User-ID": getUserId() // 헤더 추가
      },
      body: JSON.stringify({ title: node.title, content: node.content })
    });
  };

  /* ── 파일 관리 ── */
  const handleFileUpload = (e, nodeId) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    fetch(`${API_BASE}/nodes/${nodeId}/files`, { 
      method: "POST", 
      headers: { "X-User-ID": getUserId() }, // 헤더 추가
      body: formData 
    })
      .then(() => fetchWorkflowData());
  };

  const handleFileDelete = (e, fileId) => {
    e.stopPropagation();
    if (!window.confirm("파일을 삭제하시겠습니까?")) return;
    fetch(`${API_BASE}/files/${fileId}`, { 
      method: "DELETE",
      headers: { "X-User-ID": getUserId() } // 헤더 추가
    })
      .then(res => {
        if (!res.ok) throw new Error("파일 삭제 실패");
        fetchWorkflowData();
      })
      .catch(err => alert("파일 삭제 중 오류가 발생했습니다."));
  };

  const handleFilePreview = (e, file) => {
    e.stopPropagation();
    const fileUrl = file.url;
    const fileExt = file.fileName.split('.').pop().toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'].includes(fileExt)) {
      e.preventDefault();
      setPreviewFile({ url: fileUrl, type: fileExt === 'pdf' ? 'pdf' : 'image', name: file.fileName });
    }
  };

  const getAnchorPos = (node, anchor) => {
    const w = 280, h = 200;
    const cx = node.x + w / 2, cy = node.y + h / 2;
    if (anchor === "left") return { x: node.x, y: cy };
    if (anchor === "right") return { x: node.x + w, y: cy };
    return { x: cx, y: cy };
  };

  return (
    <>
      <div className="noise-overlay" />
      <div className="ambient-glow glow-1" />
      <div className="ambient-glow glow-2" />

      {/* 미리보기 모달 */}
      {previewFile && (
        <div className="wf-modal-overlay" onClick={() => setPreviewFile(null)}>
          <div className="wf-modal-content" onClick={e => e.stopPropagation()}>
            <div className="wf-modal-header">
              <span>{previewFile.name}</span>
              <button className="wf-modal-close" onClick={() => setPreviewFile(null)}>뒤로가기</button>
            </div>
            <div className="wf-modal-body">
              {previewFile.type === 'pdf' ? (
                <iframe src={previewFile.url} title="PDF Preview" className="wf-preview-frame" />
              ) : (
                <img src={previewFile.url} alt="Preview" className="wf-preview-img" />
              )}
            </div>
          </div>
        </div>
      )}

      <div className="page-wrapper">
        <nav className="nav">
          <div className="inner">
            <div className="nav-logo" onClick={onHome}>
              
              <span className="nav-logo-text">SIMVEX</span>
            </div>
            <div className="nav-links">
              {navItems.map(item => (
                <button key={item} className={`nav-link${activeNav === item ? " active" : ""}`} onClick={() => handleNav(item)}>{item}</button>
              ))}
            </div>
          </div>
        </nav>

        <section className="wf-body">
          <div className="wf-container">
            <div
              className="wf-canvas"
              ref={canvasRef}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseDown={handleCanvasMouseDown}
              onWheel={handleCanvasWheel}
            >
              <div className="wf-canvas-inner" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }}>
                <svg className="wf-connections">
                  {connections.map((conn, i) => {
                    const fromNode = nodes.find(n => n.id === conn.from);
                    const toNode = nodes.find(n => n.id === conn.to);
                    if (!fromNode || !toNode) return null;
                    const p1 = getAnchorPos(fromNode, conn.fromAnchor);
                    const p2 = getAnchorPos(toNode, conn.toAnchor);
                    const midX = p1.x + (p2.x - p1.x) / 2;
                    return (
                      <g key={i}>
                        <path
                          d={`M${p1.x},${p1.y} C${midX},${p1.y} ${midX},${p2.y} ${p2.x},${p2.y}`}
                          stroke="transparent" strokeWidth="12" fill="none"
                          style={{ cursor: "pointer", pointerEvents: "all" }}
                          onClick={() => handleConnectionClick(conn)}
                        />
                        <path d={`M${p1.x},${p1.y} C${midX},${p1.y} ${midX},${p2.y} ${p2.x},${p2.y}`} stroke="rgba(255,255,255,0.15)" strokeWidth="2" fill="none" className="wf-connection-line" style={{ pointerEvents: "none" }} />
                      </g>
                    );
                  })}
                  {connectingFrom && connectingMouse && (
                    <path
                      d={`M${getAnchorPos(nodes.find(n => n.id === connectingFrom.nodeId), connectingFrom.anchor).x},${getAnchorPos(nodes.find(n => n.id === connectingFrom.nodeId), connectingFrom.anchor).y} L${connectingMouse.x},${connectingMouse.y}`}
                      stroke="rgba(0,229,255,0.5)" strokeWidth="2" strokeDasharray="5,5" fill="none"
                    />
                  )}
                </svg>

                {nodes.map(node => (
                  <div
                    key={node.id}
                    className="wf-node"
                    style={{ left: node.x, top: node.y }}
                    onMouseDown={(e) => handleNodeMouseDown(e, node)}
                    onClick={(e) => { 
                        if (e.target.closest(".wf-node-attach") || e.target.closest("a") || e.target.closest(".wf-file-del")) return;
                        e.stopPropagation(); 
                        setEditingNode(node.id); 
                    }}
                  >
                    <div className="wf-anchor wf-anchor-left" onMouseDown={(e) => handleAnchorMouseDown(e, node.id, "left")} onMouseUp={(e) => handleAnchorMouseUp(e, node.id, "left")} />
                    <div className="wf-anchor wf-anchor-right" onMouseDown={(e) => handleAnchorMouseDown(e, node.id, "right")} onMouseUp={(e) => handleAnchorMouseUp(e, node.id, "right")} />

                    <div className="wf-node-header">
                      {editingNode === node.id ? (
                        <input className="wf-node-title-input" value={node.title} onChange={(e) => handleTitleChange(node.id, e.target.value)} onBlur={() => saveNodeData(node)} autoFocus onClick={(e) => e.stopPropagation()} />
                      ) : (
                        <div className="wf-node-title">{node.title}</div>
                      )}
                      <div className="wf-node-actions">
                        {/* 디자인 유지 + 기능 추가: label로 변경하여 input file 트리거 */}
                        <label className="wf-node-attach" onClick={(e) => e.stopPropagation()}>
                            <input type="file" style={{display:'none'}} onChange={(e) => handleFileUpload(e, node.id)} />
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <line x1="6" y1="2" x2="6" y2="10"/>
                              <line x1="2" y1="6" x2="10" y2="6"/>
                            </svg>
                        </label>
                        <button className="wf-node-delete" onClick={(e) => handleDeleteNode(e, node.id)}>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <line x1="2" y1="2" x2="10" y2="10"/>
                              <line x1="10" y1="2" x2="2" y2="10"/>
                            </svg>
                        </button>
                      </div>
                    </div>

                    <div className="wf-node-body">
                      {editingNode === node.id ? (
                        <textarea className="wf-node-content-input" value={node.content || ""} onChange={(e) => handleContentChange(node.id, e.target.value)} onBlur={() => saveNodeData(node)} onClick={(e) => e.stopPropagation()} />
                      ) : (
                        <div className="wf-node-content-text">
                            {node.content || "내용 없음"}
                            {node.files && node.files.length > 0 && (
                                <div className="wf-file-list">
                                    <div className="wf-file-label">첨부파일</div>
                                    {node.files.map(file => (
                                        <div key={file.id} className="wf-file-row">
                                            <a 
                                                href={file.url} 
                                                className="wf-file-item"
                                                onClick={(e) => handleFilePreview(e, file)}
                                                download
                                            >
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path></svg>
                                                {file.fileName}
                                            </a>
                                            <button 
                                                className="wf-file-del" 
                                                onClick={(e) => handleFileDelete(e, file.id)}
                                                title="파일 삭제"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="wf-help">
              <div className="wf-help-title">워크플로우 에디터</div>
              <div className="wf-help-item">• 노드를 드래그하여 이동할 수 있습니다</div>
              <div className="wf-help-item">• 주황색 점을 드래그하여 노드를 연결하세요</div>
              <div className="wf-help-item">• 우측 상단 + 버튼으로 새 노드를 추가할 수 있습니다</div>
              <div className="wf-help-item">• 마우스 휠로 줌 인/아웃이 가능합니다</div>
            </div>

            <button className="wf-add-btn" onClick={addNode}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>

          </div>
        </section>
      </div>
    </>
  );
}