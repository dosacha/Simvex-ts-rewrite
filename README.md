# SIMVEX TypeScript Rewrite

목표: 기존 핵심 기능을 유지하면서 타입 안정성, 모듈성, 테스트 가능성을 높인 구조로 재작성.

## 범위
- Web: React + TypeScript + Three.js
- API: Node.js + TypeScript (Fastify)
- Shared: API 계약 타입/스키마 공유

## 핵심 기능 (유지)
- 3D 모델 학습 뷰어 (파트 선택, 분해/조립 슬라이더)
- AI 질문/응답 + 사용자별 히스토리
- 메모 CRUD
- 워크플로우 노드/연결/첨부파일
- 모의고사(문제 풀이/결과)

## 현재 상태
- 프로젝트 골격 생성 완료
- 다음 단계: API 계약/도메인 타입을 먼저 고정 후 구현
