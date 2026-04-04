import { useEffect, useRef, useState, useMemo, useCallback, forwardRef, useImperativeHandle } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

/**
 * ThreeViewer - 3D 모델 뷰어 컴포넌트
 *
 * @param {string} modelUrl - GLB 파일 경로
 * @param {Array} parts - 부품 목록
 * @param {string} selectedPartKey - 선택된 부품 키
 * @param {number} assemblyProgress - 조립 진행도 (0~100)
 * @param {Function} onPartClick - 부품 클릭 핸들러
 * @param {Function} onAssemblyProgressChange - 분해도 변경 알림 핸들러
 */

// forwardRef 래핑
const ThreeViewer = forwardRef(({
  modelUrl,
  parts = [],
  selectedPartKey,
  assemblyProgress = 100,
  onPartClick,
  onAssemblyProgressChange,
  showOutlines = false,
}, ref) => { // props, ref 인자

  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);

  //const meshesRef = useRef(new Map()); // meshName -> mesh object
  const originalPositionsRef = useRef(new Map()); // meshName -> original position
  const logicalPartsRef = useRef(new Map());
  const clickableMeshesRef = useRef([]);

  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const resizeObserverRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModelReady, setIsModelReady] = useState(false);

  const DEFAULT_POS = { x: 3, y: 2, z: 5 };
  const currentModelName = useMemo(() => modelUrl ? modelUrl.split('/').pop().split('.')[0] : "default", [modelUrl]);

  // 부모 호출용 resetView 정의
  useImperativeHandle(ref, () => ({
    resetView: () => {
      if (cameraRef.current && controlsRef.current) {
        // 카메라 위치/타깃 초기화
        cameraRef.current.position.set(DEFAULT_POS.x, DEFAULT_POS.y, DEFAULT_POS.z);
        controlsRef.current.target.set(0, 0, 0);
        cameraRef.current.zoom = 1;
        cameraRef.current.updateProjectionMatrix();
        controlsRef.current.update();

        // 로컬 스토리지 시점 제거
        localStorage.removeItem(`viewer_${currentModelName}`);
      }
    }
  }));

  // 저장 로직
  const saveSession = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current || !isModelReady) { console.error("카메라나 컨트롤이 없습니다!"); return; }

    const sessionObj = {
      camera: {
        position: cameraRef.current.position.clone(),
        target: controlsRef.current.target.clone(),
        zoom: cameraRef.current.zoom
      },
      progress: assemblyProgress, // 분해도
      lastSeen: new Date().toISOString()
    };

    localStorage.setItem(`viewer_${currentModelName}`, JSON.stringify(sessionObj));
  }, [currentModelName, assemblyProgress, isModelReady]);

  // 저장 트리거
  useEffect(() => {
    if (!controlsRef.current || !isModelReady) return;

    let saveTimeout;
    const handleControlChange = () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(saveSession, 300);
    };

    // 분해도 변경 시 저장 트리거
    if (assemblyProgress !== undefined) {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(saveSession, 500);
    }

    controlsRef.current.addEventListener("change", handleControlChange);
    return () => {
      controlsRef.current?.removeEventListener("change", handleControlChange);
      clearTimeout(saveTimeout);
    };
  }, [isModelReady, saveSession, assemblyProgress]);

  // 시점/상태 복구
  useEffect(() => {
    if (!isModelReady || !cameraRef.current || !controlsRef.current) return;

    const rawData = localStorage.getItem(`viewer_${currentModelName}`);

    if (rawData) {
      const data = JSON.parse(rawData);
      const { position, target, zoom } = data.camera;

      cameraRef.current.position.set(position.x, position.y, position.z);
      controlsRef.current.target.set(target.x, target.y, target.z);
      cameraRef.current.zoom = zoom || 1;

      cameraRef.current.updateProjectionMatrix();
      controlsRef.current.update();

      // 저장 분해도 복구 + 부모 상태 업데이트
      if (data.progress !== undefined && onAssemblyProgressChange) {
        console.log(`[ThreeViewer] ${currentModelName} 상태 복구: 분해도 ${data.progress}`);
        onAssemblyProgressChange(data.progress);
      }

    } else {
      cameraRef.current.position.set(DEFAULT_POS.x, DEFAULT_POS.y, DEFAULT_POS.z);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [isModelReady, currentModelName]);

  // 초기 설정
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene 생성
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1520);
    sceneRef.current = scene;

    // Camera 생성
    const camera = new THREE.PerspectiveCamera(50, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    camera.position.set(DEFAULT_POS.x, DEFAULT_POS.y, DEFAULT_POS.z);
    cameraRef.current = camera;

    // Renderer 생성
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    // 캔버스가 레이아웃에 딱 붙도록
    renderer.domElement.style.display = "block";

    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // OrbitControls 생성
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 20;
    controlsRef.current = controls;

    // 조명 추가
    const ambientLight = new THREE.AmbientLight(0xffffff, 2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(8, 8, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0x4a8aff, 2);
    fillLight.position.set(-10, -5, -5);
    scene.add(fillLight);

    // 그리드 헬퍼
    const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
    scene.add(gridHelper);

    // 리사이즈
    const resizeToMount = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;

      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      if (!w || !h) return;

      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();

      rendererRef.current.setSize(w, h);
      rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => resizeToMount();
    window.addEventListener("resize", handleResize);

    resizeObserverRef.current = new ResizeObserver(() => {
      resizeToMount();
    });
    resizeObserverRef.current.observe(mountRef.current);

    resizeToMount();

    return () => {
      window.removeEventListener("resize", handleResize);

      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }

      cancelAnimationFrame(animationId);
      controls.dispose();
      renderer.dispose();

      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // 줌 복구 관련 (중복 로직 방지 위해 통합된 상태)
  useEffect(() => {
    if (!isModelReady || !currentModelName) return;
    const rawData = localStorage.getItem(`viewer_${currentModelName}`);
    if (rawData) {
      const data = JSON.parse(rawData);
      const { zoom } = data.camera;
      cameraRef.current.zoom = zoom || 1;
      cameraRef.current.updateProjectionMatrix();
      controlsRef.current.update();
    }
  }, [isModelReady, currentModelName]);


  // GLB 파일 로드
  useEffect(() => {
    if (!modelUrl || !sceneRef.current) return;
    setIsModelReady(false);
    setLoading(true);
    const loader = new GLTFLoader();

    loader.load(modelUrl, (gltf) => {
      const existingModel = sceneRef.current.getObjectByName("loadedModel");
      if (existingModel) sceneRef.current.remove(existingModel);

      const model = gltf.scene;
      model.name = "loadedModel";

      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2 / maxDim;
      model.scale.setScalar(scale);

      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center.multiplyScalar(scale));

      sceneRef.current.add(model);
      setIsModelReady(true);

      if (mountRef.current && cameraRef.current && rendererRef.current) {
        const w = mountRef.current.clientWidth;
        const h = mountRef.current.clientHeight;
        if (w && h) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
          rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }
      }

      setLoading(false);
      console.log(`[ThreeViewer1] Model loaded and normalized: ${modelUrl}`);
    });
  }, [modelUrl]);

  // ---------------------------------------------------------
  // 윤곽선(Edge) 토글 로직
  // ---------------------------------------------------------
  useEffect(() => {
    const model = sceneRef.current?.getObjectByName("loadedModel");
    if (!model) return;

    model.traverse((child) => {
      if (child.isMesh) {
        // 이미 외곽선 객체가 있는지 확인
        let outline = child.userData.outlineLine;

        if (!outline && showOutlines) {
          // 외곽선이 없고, 켜야 한다면 생성 (최초 1회)
          const edges = new THREE.EdgesGeometry(child.geometry, 15); // 15도는 임계값 (조절 가능)
          const material = new THREE.LineBasicMaterial({ color: 0x00e5ff, opacity: 0.5, transparent: true });
          outline = new THREE.LineSegments(edges, material);

          // 레이캐스팅 대상 제외
          outline.raycast = () => null;

          // 원본 메쉬에 자식으로 추가하여 같이 움직이게 함
          child.add(outline);
          child.userData.outlineLine = outline;
        }

        // 가시성 토글
        if (outline) {
          outline.visible = showOutlines;
        }
      }
    });
  }, [showOutlines, isModelReady]); // showOutlines나 모델 로드 상태가 바뀔 때 실행

  // [1] 데이터 매핑 (Parts 연결)
  useEffect(() => {
    const model = sceneRef.current?.getObjectByName("loadedModel");
    if (!model || parts.length === 0) return;

    // 기존 관리 리스트 초기화
    logicalPartsRef.current.clear();
    originalPositionsRef.current.clear();
    clickableMeshesRef.current = [];

    model.traverse((child) => {
      if (child.isMesh) {
        let current = child;
        let logicalPart = null;
        let partData = null;

        while (current && current !== model) {
          partData = parts.find(p => p.meshName === current.name);
          if (partData) {
            logicalPart = current;
            break;
          }
          current = current.parent;
        }

        if (logicalPart) {
          child.userData.logicalPart = logicalPart;
          child.userData.partData = partData;

          if (!logicalPartsRef.current.has(logicalPart.name)) {
            logicalPartsRef.current.set(logicalPart.name, logicalPart);
            originalPositionsRef.current.set(logicalPart.name, logicalPart.position.clone());
          }
          clickableMeshesRef.current.push(child);
        }
      }
    });
  }, [parts, modelUrl, isModelReady]);

  // [2] 조립/분해 초기화
  useEffect(() => {
    const model = sceneRef.current?.getObjectByName("loadedModel");
    if (!model || parts.length === 0 || !isModelReady) return;

    // 매핑 로직과 별개로 좌표 초기화는 parts가 바뀔 때마다 실행
    model.traverse((child) => {
      if (child.isMesh) {
        let current = child;
        let partData = null;

        while (current && current !== model) {
          partData = parts.find(p => p.meshName === current.name);
          if (partData) break;
          current = current.parent;
        }

        if (partData && logicalPartsRef.current.has(current.name)) {
          const meta = typeof partData.content === 'string'
            ? JSON.parse(partData.content)
            : partData.content;

          const homePos = new THREE.Vector3(
            meta.position.x,
            meta.position.y,
            meta.position.z
          );

          const explodeDir = new THREE.Vector3(
            meta.explodeVector.x,
            meta.explodeVector.y,
            meta.explodeVector.z
          );

          if (explodeDir.length() < 0.001) {
            explodeDir.copy(homePos).normalize();
            if (explodeDir.length() < 0.01) explodeDir.set(0, 1, 0);
          }

          current.position.copy(homePos); // 초기 위치 강제 세팅
          originalPositionsRef.current.set(current.name, homePos.clone());
          current.userData.fixedDir = explodeDir;
        }
      }
    });
  }, [parts, isModelReady]);

  // [3] 조립/분해 애니메이션 루프
  // parts dependency 포함
  useEffect(() => {
    if (!isModelReady || logicalPartsRef.current.size === 0) return;

    let animationFrameId;
    const lerpFactor = 0.05;
    const explosionStrength = 0.1;

    const animate = () => {
      let isMoving = false;
      const progress = assemblyProgress / 100;

      logicalPartsRef.current.forEach((part, partName) => {
        const homePos = originalPositionsRef.current.get(partName);
        const explodeDir = part.userData.fixedDir;
        if (!homePos) return;

        const moveDistance = progress * explosionStrength;
        const targetPos = homePos.clone().add(explodeDir.clone().multiplyScalar(moveDistance));

        part.position.lerp(targetPos, lerpFactor);

        if (part.position.distanceTo(targetPos) > 0.0001) {
          isMoving = true;
        }
      });

      if (isMoving) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, [assemblyProgress, isModelReady, parts]); // parts 포함

  // 부품 하이라이트
  useEffect(() => {
    if (logicalPartsRef.current.size === 0) return;

    clickableMeshesRef.current.forEach((mesh) => {
      if (mesh.material) {
        mesh.material.emissive.set(0x000000);
        mesh.material.emissiveIntensity = 0;
      }
    });
    if (!selectedPartKey) return;

    const selectedPart = parts.find((p) => {
      if (p?.id && selectedPartKey === `id:${p.id}`) return true;
      if (p?.meshName && selectedPartKey === `mesh:${p.meshName}`) return true;
      return false;
    });

    if (!selectedPart) return;

    const targetGroup = logicalPartsRef.current.get(selectedPart.meshName);
    if (targetGroup) {
      targetGroup.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.emissive.set(0x00e5ff);
          child.material.emissiveIntensity = 0.5;
        }
      });
    }

  }, [selectedPartKey, parts]);

  // 부품 클릭 감지
  useEffect(() => {
    if (!rendererRef.current || !onPartClick) return;

    const handleClick = (event) => {
      if (!cameraRef.current || !sceneRef.current) return;

      const rect = rendererRef.current.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

      const intersects = raycasterRef.current.intersectObjects(clickableMeshesRef.current, true);

      if (intersects.length > 0) {
        const clickedMesh = intersects[0].object;
        const partData = clickedMesh.userData.partData;

        if (partData) {
          onPartClick(partData);
        }
      } else {
        onPartClick(null);
      }
    };

    rendererRef.current.domElement.addEventListener("click", handleClick);
    return () => rendererRef.current?.domElement.removeEventListener("click", handleClick);
  }, [onPartClick]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />

      {loading && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "#7dd3e0",
            fontSize: "16px",
            fontWeight: "500",
            textAlign: "center",
          }}
        >
          <div style={{ marginBottom: "10px" }}>3D 모델 로딩 중...</div>
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "3px solid #1a3a4a",
              borderTop: "3px solid #00e5ff",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto",
            }}
          />
        </div>
      )}

      {error && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "#ff6b6b",
            fontSize: "14px",
            textAlign: "center",
            padding: "20px",
            background: "rgba(26, 42, 58, 0.9)",
            borderRadius: "8px",
            border: "1px solid rgba(255, 107, 107, 0.3)",
          }}
        >
          {error}
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
});

export default ThreeViewer;