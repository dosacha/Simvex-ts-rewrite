# Project Status

기준일: 2026-02-17

## 전체 진행률
- 약 99%

## 완료 항목
- TypeScript 모노레포(`web/api/shared`) 구조 이식 완료
- 핵심 API(models/study/ai/memos/workflow/exam) 동작 및 계약 테스트 반영 완료
- repository 드라이버(memory/file/postgres) 분리 완료
- Postgres 마이그레이션 체계 + 제약조건/FK 적용 완료
- 로컬 DB 실행/마이그레이션/스모크체크 스크립트 정리 완료
- CI에서 typecheck, migration validate, unit/postgres 테스트 자동화 완료
- 운영 Runbook/보안 체크리스트 문서화 완료

## 잔여 항목
- 실 OpenAI 연동 도입 시 재시도/타임아웃 정책 확정
- 스테이징 리허설 재실행 및 최종 판정 (현재 `docs/STAGING_REHEARSAL_2026-02-18.md`에 환경변수 미설정으로 보류 기록)

## 종료 기준
1. 배포 변수 템플릿 문서 확정
2. 스테이징에서 `db:smoke` + 핵심 API 계약 테스트 통과
3. 운영 릴리스 체크리스트 1회 리허설 완료
