# 프로젝트 상태

기준일: 2026-05-04 (JWT 검증 도입 시점)

## 코드 상태
- 1·2·3·4단계 리팩토링 완료 (외부 코드 리뷰 P0/P1/P2 해결)
- 5단계 narrative cleanup 완료 (외부 부정 분석 종합, P0 6항목)
- 6단계 multipart 보안 fix + 문서 정합성 회복 완료
- **JWT 검증 도입 완료** - `X-User-ID` 헤더 인증 제거, `Authorization: Bearer <token>` 으로 전환

> 단계의 정의는 `README.md` 의 "리팩토링 단계 정의" 섹션 참고.

## 완료 항목
- 미사용 Vite/TypeScript 프론트 workspace 제거
- TypeScript API/shared 4계층 클린 아키텍처 (1단계 리팩토링)
- Fastify auth plugin 격리 + JSON schema validation (1·2단계)
- 핵심 API (models/study/ai/memos/workflow/exam) 동작 + 통합 테스트 그린
  - test:unit 14/14 (계약 10, 도메인 4)
  - test:postgres 2/2
- repository driver (memory/file/postgres) 분리 완료
- Postgres 마이그레이션 체계 + ON DELETE CASCADE 적용 (4단계 트랜잭션 단순화)
- 로컬 DB 실행/마이그레이션/스모크체크 스크립트 (`db:up`, `db:migrate:local` 등)
- 보안 모델 문서화 (`docs/SECURITY_MODEL.md`)
- ESLint flat config + Prettier 도입 (workspace 전체)
- memo 도메인 response schema 도입 (v2)

## 5단계 narrative cleanup (2026-05-03 완료)
- P0-5 dead sentinel 제거 (`AiInputValidationError`)
- P0-3 dead entity 제거 (`memo.entity.ts`)
- P0-6 502 -> 500 (RFC 의미 정확화)
- P0-4 schema 정책 코멘트 통일 (memo / workflow)
- P0-2 GET v2 이전 + legacy v1 routes 제거
- workflow controller 의 default-guest fallback 마지막 1군데 제거 (11 -> 0)
- 통합 테스트 그대로 그린 (회귀 0)

## 6단계 narrative + system fix (2026-05-03 완료)
- multipart register 위치를 auth plugin scope 안으로 이동 (commit `15bc460`)
  - 미인증 요청이 buffer 적재 전에 401 차단 -> unauthenticated DoS 방어
- 도메인 폴더 구조를 4-layer 위치로 정리 (`refactor(structure)`, commit `311029d`)
- 문서 정합성 회복 - 코드와 narrative 간 마지막 불일치 제거

## JWT 검증 도입 (2026-05-04 완료)
- `X-User-ID` 헤더 인증 제거 (commit `4f4f8c8`)
- `Authorization: Bearer <token>` (HS256) + `@fastify/jwt` 서명 검증
- secret 길이 검증 (최소 32자)
- auth plugin 한 곳만 교체로 마무리 - 1단계 격리 설계의 가치 실증
- 정식 login / refresh token 흐름은 backlog. 현재 개발 환경에서는 `npm run mint-token` 으로 토큰 발급

## 잔여 항목
- legacy-ui 의 v1 path -> v2 path 마이그레이션 또는 신규 SPA 교체
- OpenAI 실제 연동 시 오류 메시지 마스킹 정책 검증
- e2e 테스트 도입 (in-memory 검증 한계 보강, dockerized postgres)
- 정식 login / 회원가입 (bcrypt) + refresh token rotation

## 종료 기준
1. v2 API path 와 JWT 검증 기준으로 legacy-ui 또는 신규 SPA 연결
2. `typecheck`, `test:unit`, `test:postgres`, `migrate:validate` 통과
3. OpenAI 오류 마스킹 정책 검증
4. 정식 login / 회원가입 흐름 backlog 범위 확정
