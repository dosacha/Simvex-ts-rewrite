# 프로젝트 상태

기준일: 2026-05-03 (5단계 narrative cleanup 완료 시점)

## 운영 환경
- AWS 배포 완료 — Live URL: https://d1jk6rz3s30fgw.cloudfront.net
- 운영 코드 base: 4단계 종착점 (`origin/main = 25ff09e`)
- 운영 프론트: `legacy-ui/simvex-ui-main` (S3 + CloudFront OAC)
- 운영 API: Lambda (Fastify, Node.js 20 arm64, 512 MB)
- 운영 DB: Neon PostgreSQL Singapore region

## 코드 상태 (origin/main = 7773c60)
- 1·2·3·4단계 리팩토링 완료 (외부 코드 리뷰 P0/P1/P2 해결)
- 5단계 narrative cleanup 완료 (외부 부정 분석 종합, P0 6항목)
- 단 5단계 코드는 운영 Lambda 미배포 (의식적 결정 — 다음 배포 사이클로)

## 완료 항목
- 운영 프론트를 `legacy-ui/simvex-ui-main` 기준으로 확정 (운영 배포 완료)
- 미사용 Vite/TypeScript 프론트 workspace 제거
- TypeScript API/shared 4계층 클린 아키텍처 (1단계 리팩토링)
- Fastify auth plugin 격리 + JSON schema validation (1·2단계)
- 핵심 API (models/study/ai/memos/workflow/exam) 동작 + 통합 테스트 14/14 그린
- repository driver (memory/file/postgres) 분리 완료
- Postgres 마이그레이션 체계 + ON DELETE CASCADE 적용 (4단계 트랜잭션 단순화)
- 로컬 DB 실행/마이그레이션/스모크체크 스크립트 (`db:up`, `db:migrate:local` 등)
- 운영 Runbook (`docs/OPERATIONS_RUNBOOK.md`) + 보안 체크리스트 문서화
- AWS Deployment 아키텍처 문서화 (`docs/AWS_DEPLOYMENT.md`)

## 5단계 narrative cleanup (2026-05-03 완료, 운영 미배포)
- P0-5 dead sentinel 제거 (`AiInputValidationError`)
- P0-3 dead entity 제거 (`memo.entity.ts`)
- P0-6 502 → 500 (RFC 의미 정확화)
- P0-4 schema 정책 코멘트 통일 (memo / workflow)
- P0-2 GET v2 이전 + legacy v1 routes 통째 제거
- workflow controller 의 default-guest fallback 마지막 1군데 제거 (11 → 0)
- 통합 테스트 14/14 그대로 그린 (회귀 0)
- 운영 미배포 이유: legacy-ui 가 v1 path 호출, 5단계 코드 그대로 배포 시 운영 깨짐

## 잔여 항목
- 신규 SPA 개발 (v2 path 사용) — 5단계 코드와 동시 배포 예정
- legacy-ui 의 v1 path → v2 path 마이그레이션 또는 신규 SPA 교체
- OpenAI 실제 연동 시 오류 메시지 마스킹 정책 검증 (5단계 P0-6 에서 500 마스킹 정리 완료, 운영 배포 후 검증)
- 실제 stage 인프라 / DB 기준 리허설 1회 실행 기록
- e2e 테스트 도입 (in-memory 검증 한계 보강, dockerized postgres)
- CI/CD 자동화 (현재 CI 만 — typecheck + unit + postgres test)

## 다음 배포 사이클 흐름 (strangler fig 의 last-mile)
1. 신규 SPA 개발 (v2 path 사용)
2. legacy-ui + 신규 SPA 동시 운영 가능 시점 만들기
3. 5단계 코드 + 신규 SPA + legacy-ui transition 동시 배포
4. legacy-ui 트래픽 0 확인 후 archive

## 종료 기준
1. 배포 변수 템플릿 문서 확정 (`docs/DEPLOYMENT_ENV_TEMPLATE.md`)
2. 스테이징에서 `db:smoke`와 핵심 API 계약 테스트 통과
3. 운영 릴리즈 체크리스트 1회 리허설 완료
4. `docs/FINAL_SIGNOFF_CHECKLIST.md` 기준 최종 사인오프 완료
5. **(추가)** 신규 SPA 개발 후 5단계 코드 운영 배포 + legacy-ui transition
