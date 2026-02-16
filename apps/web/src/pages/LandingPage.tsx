import { Link } from "react-router-dom";

export function LandingPage() {
  return (
    <section>
      <h1>SIMVEX TypeScript 프로젝트</h1>
      <p>기존 핵심 기능을 유지하면서 더 안전하고 유지보수하기 쉬운 구조로 변환 중입니다.</p>
      <p>
        <Link to="/study">학습 시작하기</Link>
      </p>
    </section>
  );
}
