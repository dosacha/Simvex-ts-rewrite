# Final Sign-off Checklist

기준일: 2026-02-18

## 현재 상태
- 코드/테스트/로컬 DB 리허설은 통과 완료.
- 남은 종료 게이트는 실제 stage 인프라 DB 기준 리허설 1회 실행/기록.

## 마지막 실행 절차 (실제 stage 인프라)
1. `env/stage.env`에 실제 stage DB 접속값 입력.
2. 아래 명령 실행.

```powershell
cd C:\Users\dosac\Desktop\2026020614-main\2026020614-main\ts-rewrite
.\scripts\run-stage-rehearsal.ps1 -EnvFile env/stage.env
```

3. 실행 결과를 `docs/STAGING_REHEARSAL_2026-02-18.md`에 추가 기록.

## 통과 기준
- `rehearsal:check` 통과
- `migrate:validate` 통과
- `db:smoke` 통과
- `test:unit` pass / fail = 0

## 최종 종료 조건
- 위 통과 기준 충족 로그가 문서로 기록되면 프로젝트 종료로 선언.
