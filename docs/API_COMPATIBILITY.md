# API 호환 맵

기준일: 2026-05-04 (JWT 인증 도입 시점)

이 문서는 SIMVEX 의 두 가지 코드 base 의 API 를 모두 명시합니다:
- **운영 환경 (현재)**: 4단계 종착점 (`origin/main = 25ff09e`) 코드 = v1 endpoint, X-User-ID 헤더 인증 시절
- **다음 배포 사이클**: 5단계 + JWT 인증 도입 후 코드 = v2 endpoint, `Authorization: Bearer <token>`

legacy-ui 가 v1 path + X-User-ID 헤더로 호출하는 흐름이라 운영에는 v1 살아있고,
다음 배포 사이클은 v1 통째 제거 + v2 통일 + JWT 전환이라 같이 배포할 수 없음.
다음 배포 사이클에서 신규 SPA + 코드 + legacy-ui transition 동시 배포 예정.

## 운영 환경 엔드포인트 (v1, Lambda = 25ff09e 코드)

### 공용 (인증 불필요)
- GET `/api/study/catalog`

### 인증 필요 (`X-User-ID` 헤더)
- GET `/api/models`
- GET `/api/models/:id`
- GET `/api/models/:id/parts`
- GET `/api/models/:id/quizzes`
- GET `/api/models/exam?modelIds=1,2`
- GET `/api/models/:id/memos`
- POST `/api/models/:id/memos`
- PUT `/api/memos/:id`
- DELETE `/api/memos/:id`
- GET `/api/ai/history/:modelId`
- POST `/api/ai/ask`
- GET `/api/workflow`
- POST `/api/workflow/nodes`
- PUT `/api/workflow/nodes/:id`
- DELETE `/api/workflow/nodes/:id`
- POST `/api/workflow/connections`
- DELETE `/api/workflow/connections`
- POST `/api/workflow/nodes/:nodeId/files`
- GET `/api/workflow/files/download/:id`
- DELETE `/api/workflow/files/:id`

## 다음 배포 사이클 엔드포인트 (v2, 코드 = 7773c60)

### 공용
- GET `/api/study/catalog`
- GET `/api/v2/models`
- GET `/api/v2/models/:id`
- GET `/api/v2/models/:id/parts`
- GET `/api/v2/models/:id/quizzes`
- GET `/api/v2/exam?modelIds=1,2`  ← v1 의 `/api/models/exam` 에서 path 변경
- POST `/api/v2/exam/submit`  ← **신규 엔드포인트** (v1 에 없던 서버 채점)

### 인증 필요 (`Authorization: Bearer <token>` 헤더, JWT)
- GET `/api/v2/models/:id/memos`
- POST `/api/v2/models/:id/memos`
- PUT `/api/v2/memos/:id`
- DELETE `/api/v2/memos/:id`
- GET `/api/v2/ai/history/:modelId`
- POST `/api/v2/ai/ask`
- GET `/api/v2/workflow`
- POST `/api/v2/workflow/nodes`
- PUT `/api/v2/workflow/nodes/:id`
- DELETE `/api/v2/workflow/nodes/:id`
- POST `/api/v2/workflow/connections`
- DELETE `/api/v2/workflow/connections?id=N | ?from=N&to=M`
- POST `/api/v2/workflow/nodes/:nodeId/files`
- GET `/api/v2/workflow/files/:fileId`  ← v1 의 `/files/download/:id` 에서 path 변경
- DELETE `/api/v2/workflow/files/:fileId`

## 정책

### v1 (운영 Lambda, X-User-ID 시절)
- 모든 mutating endpoint 는 `X-User-ID` 헤더로 사용자 식별 (인가만, 인증 부재)
- 시험 API 는 정답 (`answer`) 미포함 응답
- 파일 다운로드는 파일 소유권 검증 후 제공
- AI 오류 메시지 마스킹 (502)

### v2 (다음 배포 사이클, JWT)
- 모든 mutating endpoint 는 JWT 의 `sub` claim 으로 사용자 식별 — 인증 + 인가 둘 다 작동
- 시험 API 는 정답 (`answer`) 미포함 응답
- 파일 다운로드는 파일 소유권 검증 후 제공
- AI 오류 메시지 마스킹 (500)

## 인증 / 토큰 정책 (v2)
- `Authorization: Bearer <token>` (JWT, HS256)
- secret 은 `SIMVEX_JWT_SECRET` 환경 변수 (최소 32자) — 환경별 분리
- 토큰 payload 의 `sub` claim 이 userId
- 만료된 / 서명 불일치 / 형식 오류 토큰 — 모두 단일 401 ("인증이 필요합니다.")
- 정식 로그인 / refresh token 흐름은 backlog — 현재 dev 는 `npm run mint-token` 으로 발급

## 주요 변경 (v1 → v2)

### Path / 헤더 변경
| v1 | v2 | 설명 |
|---|---|---|
| `/api/models/...` | `/api/v2/models/...` | prefix 추가 |
| `/api/memos/...` | `/api/v2/memos/...` | prefix 추가 |
| `/api/ai/...` | `/api/v2/ai/...` | prefix 추가 |
| `/api/workflow/...` | `/api/v2/workflow/...` | prefix 추가 |
| `/api/models/exam` | `/api/v2/exam` | 도메인 분리 |
| `/api/workflow/files/download/:id` | `/api/v2/workflow/files/:fileId` | path 단순화 |
| `X-User-ID: <userId>` | `Authorization: Bearer <jwt>` | 인가 → 인증 + 인가, 헤더 통째 교체 |

### 신규
- `POST /api/v2/exam/submit` — 서버-사이드 시험 채점 (v1 은 클라이언트 채점)

### 제거
- v1 의 모든 endpoint (5단계 P0-2 commit `6a21ce5` 에서 통째 제거)
- legacy v1 routes.ts 파일 통째 삭제
