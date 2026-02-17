# Rewrite Plan

## 아키텍처 방향
- 프론트: React + TypeScript + feature-based 폴더
- 백엔드: Fastify + TypeScript + 도메인 모듈
- 공유 계약: `packages/shared`에서 타입 단일 소스 관리

## 기존 대비 개선 포인트
- 권한 검증: 모든 수정/삭제 API에 `userId` 소유권 검사 강제
- 보안: 파일 업로드 파일명 정규화, CORS 최소 허용 원칙
- 도메인 정합성: `description/desc` 키 통일
- 시험 보안: 정답은 제출 시점까지 서버 비공개
- 테스트: 계약 테스트 + 도메인 유닛 테스트 추가

## 단계별 마이그레이션
1. API 계약 고정 (완료)
2. DB 스키마 설계 및 repository 구현 (완료)
3. 모델/스터디/AI API 구현 (완료)
4. 워크플로우/메모 API 구현 (완료)
5. 프론트 페이지별 이식 (완료)
6. E2E 검증 및 성능 최적화 (진행 중)

## 현재 마무리 단계
- CI에서 마이그레이션 검증 + unit/postgres 테스트 분리 완료
- 로컬/운영 Runbook 문서화 완료
- 남은 작업:
  - 실 OpenAI 클라이언트 연동 시 오류 메시지 마스킹 정책 확정
  - 운영 환경별 배포 변수 템플릿(dev/stage/prod) 고정

## 1차 마일스톤 (MVP)
- `/api/models`, `/api/models/:id/parts`
- `/api/ai/ask`, `/api/ai/history/:modelId`
- `/api/models/:id/memos`, `/api/memos/:id`
- Learn 페이지 기본 동작 (3D + AI + 메모)
