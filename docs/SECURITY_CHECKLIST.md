# 보안 체크리스트

기준일: 2026-05-04 (JWT 인증 도입 시점)

## 운영 환경 기준 (Lambda = 4단계 종착점 25ff09e)
- [x] 메모 수정/삭제 소유권 검증 (인가, repository 의 user_id 조건)
- [x] 워크플로우 노드/파일 접근 소유권 검증
- [x] 업로드 파일명 sanitize
- [x] CORS 허용 오리진 제한 (`SIMVEX_CORS_ORIGINS` 환경 변수, 미설정 시 localhost dev)
- [x] 정답 데이터 서버-사이드 채점으로 이동 (`POST /v2/exam/submit` 구현, but legacy-ui 는 클라이언트 채점)
- [x] AI 오류 메시지 마스킹 (운영 환경: 502 + 공통 메시지)
- [x] S3 origin OAC 보호 (CloudFront 우회 직접 접근 차단)
- [x] Lambda 가 API Gateway 뒤에 위치 (외부 직접 접근 차단)

## 코드 상태 기준 (origin/main, 운영 미배포)
- [x] AI 오류 메시지 마스킹 정책 갱신: **502 → 500 + `meta.error: "ai service unavailable"`** (5단계 P0-6)
   - 502 (Bad Gateway) 의 RFC 의미 부정확 — DB write 실패 같은 internal error 라 500 이 정확
   - 운영 Lambda 는 5단계 미배포라 현재 502 응답 (다음 배포 사이클에서 500 으로 전환)
- [x] default-guest fallback 자리 11 → 0 (5단계 cleanup, workflow 도메인)
- [x] legacy v1 routes 통째 제거 (5단계 P0-2, 운영 영향: legacy-ui 가 v1 호출하므로 운영 미배포 결정)
- [x] multipart register 위치를 auth plugin scope 안으로 이동 — 미인증 요청이 buffer 적재 전에 401 차단 (DoS 위험 제거)
- [x] **인증 (Authentication) JWT 서명 검증 도입** — `X-User-ID` 헤더 인증 통째 제거
   - `Authorization: Bearer <token>` (HS256, secret = `SIMVEX_JWT_SECRET`, 최소 32자)
   - `@fastify/jwt` 가 서명 / 만료 / 형식 검증
   - plugin 이 sub 비어있음 / exp 누락 (영구 토큰) 도 추가로 차단
   - auth plugin 한 곳만 교체로 마무리 — 1단계 격리 설계의 가치 실증
   - 단, *정식 login / 비밀번호 / refresh* 는 별도 작업 (아래 backlog 참고)

## 인증 vs 인가
- [x] **인증의 토큰 검증 단계** (Authentication, verify): 서버 secret 으로 서명된 JWT 만 통과 — 구현됨
- [ ] **인증의 신원 증명 단계** (Authentication, prove): 사용자가 비밀번호로 자기 신원을 1차 증명 — 부재 (backlog)
   - 현재는 운영자가 mint-token 으로 임의 sub 의 토큰을 발급할 수 있음 (데모 단계의 의식적 한계)
- [x] **인가** (Authorization): sub 이 식별하는 사용자의 자원만 접근 — 구현됨
   - repository 의 `user_id` 조건 + 다른 사용자 자원 접근 시 404 (정보 누설 방지)

## Backlog 보안 항목
- [ ] 정식 login / 회원가입 (bcrypt 비밀번호 해싱, users 테이블, login endpoint)
- [ ] Refresh token rotation + revocation list (현재는 만료 시 mint-token 으로 재발급, 토큰 무효화 불가)
- [ ] Response schema 도입 (현재 입력 schema 만)
- [ ] Repository multi-step 트랜잭션 (createConnection 등의 race window 보호)
- [ ] WAF / rate limiting (CloudFront / API Gateway 기본 정책 외)
- [ ] e2e 보안 테스트 (dockerized postgres 통합)