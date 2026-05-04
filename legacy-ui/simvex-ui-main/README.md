# legacy-ui — hackathon mvp 클라이언트

## 현재 상태 (2026-05-03)

이 디렉토리는 SIMVEX 의 **운영 프론트**입니다.

- 출처: Blaybus hackathon mvp 의 React 클라이언트
- 운영 배포: AWS S3 + CloudFront OAC (private origin)
- Live URL: https://d1jk6rz3s30fgw.cloudfront.net
- 호출 API: v1 endpoint (운영 Lambda 의 4단계 종착점 코드 = 25ff09e)

## 한계 (다음 배포 사이클에서 해결)

### 1. v1 endpoint 사용
서버 코드는 5단계 narrative cleanup (origin/main = f26a9f2) 후 v2 으로 통일
되었지만, 운영 Lambda 는 4단계 종착점 코드 실행 중이라 v1 endpoint 가
살아있음. legacy-ui 가 호출하는 v1 path:

```
/api/workflow                 → /api/v2/workflow
/api/models                   → /api/v2/models
/api/models/{id}              → /api/v2/models/{id}
/api/models/{id}/parts        → /api/v2/models/{id}/parts
/api/models/{id}/quizzes      → /api/v2/models/{id}/quizzes
/api/models/{id}/memos        → /api/v2/models/{id}/memos
/api/memos/{id}               → /api/v2/memos/{id}
/api/ai/history/{id}          → /api/v2/ai/history/{id}
/api/ai/ask                   → /api/v2/ai/ask
/api/models/exam              → /api/v2/exam
```

다음 배포 사이클에서 신규 SPA 개발 + v2 path 사용으로 마이그레이션 예정.

### 2. 클라이언트 채점 (시험)
`Exampage.js` 의 채점 코드:
```javascript
if (userAnswers[i] === q.answer) cnt++;
```

이건 hackathon 시점의 answer 노출 모델의 잔재. 서버 v2 에는 `POST /v2/exam/submit`
서버 채점 endpoint 구현 + `GET /v2/models/:id/quizzes` 가 answer 필드 비노출.
신규 SPA 가 서버 채점 사용하도록 전환 예정.

### 3. 파일 다운로드 브라우저 동작
`Workflowpage.js` 의 파일 다운로드:
```javascript
<a href={file.url}>...</a>
```

서버 v2 의 `/api/v2/workflow/files/:fileId` 는 `Authorization: Bearer <token>` 헤더 인증 필수.
`<a href>` 클릭 시 브라우저는 헤더 자동 추가하지 않음 → 다운로드 401.

운영 환경에서는 v1 endpoint (`/api/workflow/files/download/:id`) 사용 중이라
이 자리는 운영에 영향 없음. 단 신규 SPA 도입 시 fetch + blob 처리 또는
short-lived signed URL 패턴으로 전환 필요.

### 4. JavaScript (TypeScript X)
hackathon 시점 코드라 TypeScript 미적용. 신규 SPA 는 TypeScript + 4계층 분리
(Server 와 같은 패턴) 로 작성 예정.

## 작업 history

```
hackathon mvp (2026 02월)        : Blaybus 진출, 기본 React 클라이언트 작성
이름 변경 (2026 04월)             : monorepo 의 legacy-ui/simvex-ui-main 으로 이동
운영 배포 (2026 04월)             : AWS S3 + CloudFront OAC 로 운영 배포
backend rewrite (2026 04~05월)   : Java → TypeScript 4계층 백엔드 (apps/api)
1·2·3·4단계 cleanup (2026 04월)  : P0/P1/P2 외부 코드 리뷰 해결
5단계 narrative cleanup (2026 05/03) : v1 routes 통째 제거, 단 운영 미배포
6단계 narrative + system (2026 05/03) : multipart 보안 fix + docs 정합성 회복
```

## 다음 단계 (backlog)

```
1. 신규 SPA 개발 (v2 path 사용)
2. legacy-ui + 신규 SPA 동시 운영 가능 시점 만들기
3. 5단계 코드 + 신규 SPA 동시 배포 (Lambda update + S3 sync)
4. legacy-ui 트래픽 0 확인 후 archive
```

이건 strangler fig 패턴의 last-mile 작업 — 5단계 cleanup 의 인프라가 6단계
narrative 통해 진실됐음을 의미.

## 면접 narrative

> _\"legacy-ui 는 hackathon mvp 의 클라이언트이고 현재 운영 프론트입니다.
> AWS S3 + CloudFront 로 배포되어 사용자가 실제로 접근 가능합니다. 단 한계가
> 있습니다 — v1 path 호출 (운영 Lambda 가 4단계 종착점 코드 실행), JavaScript,
> 클라이언트 채점, <a href> 다운로드. 신규 SPA 와 함께 archive 예정이고
> 그게 strangler fig 의 last-mile.\"_
