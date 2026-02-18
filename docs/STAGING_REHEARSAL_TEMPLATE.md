# Staging Rehearsal Template

기준일: 2026-02-17

## 목적
- 운영 릴리스 전, 스테이징 환경에서 DB/핵심 API 안정성을 사전 검증하기 위한 실행/기록 템플릿.

## 사전 조건
- `docs/DEPLOYMENT_ENV_TEMPLATE.md` 기준으로 `stage` 환경변수 세팅 완료.
- `env/stage.example.env`를 참고해 실제 stage Secret 값 주입 완료.
- 스테이징 DB 접근 가능 상태.
- `SIMVEX_REPOSITORY_DRIVER=postgres` 설정 완료.

## 실행 명령
```bash
npm run rehearsal:stage
```

Windows PowerShell에서 env 파일까지 자동 로드하려면:
```powershell
.\scripts\run-stage-rehearsal.ps1 -EnvFile env/stage.env
```

내부 실행 순서:
1. `npm run rehearsal:check -w @simvex/api`
2. `npm run migrate:validate -w @simvex/api`
3. `npm run db:smoke -w @simvex/api`
4. `npm run test:unit -w @simvex/api`

## 결과 기록
- 실행 일시:
- 실행자:
- 대상 환경: `stage`
- API 버전(커밋 SHA):
- DB 버전(`schema_migrations` 최신):

### 체크 항목
- [ ] migration validate 통과
- [ ] db smoke 통과
- [ ] unit/contract 테스트 통과
- [ ] 실패 시 롤백 절차/원인 기록 완료

### 장애/이슈 기록
- 증상:
- 원인:
- 조치:
- 재검증 결과:

### 최종 판정
- [ ] 배포 진행 가능
- [ ] 보류 (추가 조치 필요)
