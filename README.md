# SIMVEX TypeScript Rewrite

기존 SIMVEX MVP의 핵심 기능을 유지하면서, 타입 안정성/테스트 가능성/운영 가능성을 높이기 위해 재작성한 프로젝트.

## Stack
- Web: React + TypeScript + Three.js
- API: Node.js + TypeScript (Fastify)
- Shared: 공통 API 타입/계약
- DB: PostgreSQL (선택), memory/file 드라이버 지원

## 핵심 기능
- 3D 모델 학습 뷰어 (파트 선택, 분해/조립)
- AI 질문/응답 + 사용자별 히스토리
- 메모 CRUD
- 워크플로우 노드/연결/파일
- 시험 출제/제출/채점

## 프로젝트 구조
```text
apps/
  api/      # Fastify API
  web/      # React + Vite 웹
packages/
  shared/   # 공통 타입
legacy-ui/
  simvex-ui-main/  # 기존 UI 소스 참조용
```

## 빠른 시작
1. 의존성 설치
```bash
npm install
```

2. 로컬 PostgreSQL 실행
```bash
npm run db:up
npm run db:migrate:local
```

3. API 실행 (Postgres 모드)
```bash
npm run dev:api:pg
```

4. Web 실행
```bash
npm run dev -w @simvex/web
```

## API 저장소 드라이버
- `memory` (기본)
- `file`
- `postgres`

드라이버 선택:
```powershell
$env:SIMVEX_REPOSITORY_DRIVER='postgres'
```

Postgres 연결:
```powershell
$env:DATABASE_URL='postgres://dosacha:dosacha@localhost:5432/simvex'
```

file 모드 사용 시:
```powershell
$env:SIMVEX_REPOSITORY_DRIVER='file'
$env:SIMVEX_REPOSITORY_FILE='C:\\data\\simvex-repo.json'
```

## 검증 명령
- 마이그레이션 검증: `npm run migrate:validate -w @simvex/api`
- DB 스모크체크: `npm run db:smoke -w @simvex/api`
- API unit/contract 테스트: `npm run test:unit -w @simvex/api`
- API postgres 테스트: `npm run test:postgres -w @simvex/api`
- API 타입체크: `npm run typecheck -w @simvex/api`
- Web 타입체크: `npm run typecheck -w @simvex/web`

## 스테이징 리허설
- env 예시: `env/stage.example.env`
- 실행 스크립트(Windows): `scripts/run-stage-rehearsal.ps1`

```powershell
Copy-Item .\env\stage.example.env .\env\stage.env
.\scripts\run-stage-rehearsal.ps1 -EnvFile env/stage.env
```

참고: `env/*.env`는 `.gitignore`로 제외되어 실제 비밀값이 커밋되지 않음.

## Legacy UI 실행
기존 UI는 참조/비교를 위해 `legacy-ui/simvex-ui-main`에 포함됨.

```bash
cd legacy-ui/simvex-ui-main
npm install
npm start
```

- 기본 주소: `http://localhost:3000`
- API 프록시 기준: `http://localhost:8080`

## 운영 문서
- Runbook: `docs/OPERATIONS_RUNBOOK.md`
- 보안 체크리스트: `docs/SECURITY_CHECKLIST.md`
- 진행 현황: `docs/PROJECT_STATUS.md`
- 최종 사인오프: `docs/FINAL_SIGNOFF_CHECKLIST.md`
- 배포 변수 템플릿: `docs/DEPLOYMENT_ENV_TEMPLATE.md`
- 리허설 템플릿: `docs/STAGING_REHEARSAL_TEMPLATE.md`
