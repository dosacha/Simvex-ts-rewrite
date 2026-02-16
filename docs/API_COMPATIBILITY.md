# API Compatibility Map

## 유지 엔드포인트
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

## 개선 정책
- 모든 mutating endpoint는 `X-User-ID`를 받고 소유권 검증
- 시험 API는 기본적으로 정답(`answer`) 미포함 응답
- 파일 다운로드는 파일 소유권 검증 후 제공
