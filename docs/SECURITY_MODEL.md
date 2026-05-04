## Security 모델

### 인증 (Authentication) — 구현됨 (JWT)

```
헤더: Authorization: Bearer <token>
서명/검증: HS256, secret = SIMVEX_JWT_SECRET (최소 32자)
sub claim = userId
exp claim 검증으로 만료 토큰 자동 거부
```

`@fastify/jwt` 가 서명 / 만료 / 형식을 검증한다. 인증 plugin
(`apps/api/src/interfaces/http/plugins/auth.plugin.ts`) 의 preHandler 가
v2 인증 라우트 register 안에서만 동작 — 공용 라우트는 토큰 없이 접근 가능.
검증 실패 / 헤더 누락 / 서명 불일치 / 만료 / 빈 sub — 모두 단일 401 메시지로
응답하여 공격자에게 단서를 주지 않는다.

토큰 발급:
- 개발: `npm run mint-token -w @simvex/api -- <userId> [expiresIn]`
- 운영: 정식 로그인 / 회원가입 / refresh token rotation 은 별도 작업 (BACK 항목)

### 인가 (Authorization) — 구현됨

```
권한 격리 = repository 의 user_id 조건
모든 mutating 쿼리는 (user_id = $1 AND ...) 자동 포함
다른 사용자의 자원 조회 시 404 (정보 누설 방지, 403 X)
```

JWT 의 sub claim 이 식별하는 사용자의 자원만 접근 가능. repository 가 모든
쿼리에 `user_id` 조건을 자동 포함하여 도메인 로직과 권한 격리를 분리.
인증이 그 sub 값을 신뢰할 수 있도록 만들어 주고, 인가가 그 값으로 데이터를
필터링한다 — 두 층의 책임 분리.

### CORS

```
환경 변수: SIMVEX_CORS_ORIGINS (콤마 구분)
미설정 fallback: localhost dev 만 허용 (production 차단 fail-safe)
credentials: true (Authorization 헤더 / cookie 포함 허용)
```

production 배포 시 환경 변수 설정 필수. 미설정 시 외부 노출 방지.

### Multipart 보안 (6단계 fix, commit 15bc460)

```
register 위치: auth plugin scope 안 (이전엔 밖에서 register)
이유: 미인증 요청이 buffer 적재 전에 401 반환되도록
효과: unauthenticated DoS 방어
```

5단계 narrative cleanup 후 발견된 자리. 6단계 fix 로 \"auth plugin scope
안에서 통일\" narrative 가 비로소 진실.

### File 업로드 보안

```
파일명 sanitize: 제어 문자 / 경로 구분자 제거 (file.entity.ts: sanitizeFileName)
크기 제한: 20MB (server.ts: multipart fileSize)
응답: id + fileName + URL 만 노출 (buffer 절대 노출 안 함)
다운로드: 파일 소유권 검증 후 응답
```

### AI 오류 마스킹

```
운영 환경 (Lambda = 25ff09e): 502 + 공통 메시지
코드 상태 (origin/main = 7773c60+): 500 + meta.error: \"ai service unavailable\" (5단계 P0-6)
```

5단계에서 RFC 의미 정확화 (502 \"Bad Gateway\" → 500 \"Internal Server Error\").
운영 Lambda 는 5단계 미배포라 현재 502 응답. 다음 배포 사이클에서 500 으로 전환.

### S3 origin OAC (Origin Access Control)

```
S3 bucket: private (외부 직접 접근 차단)
CloudFront only: OAC 통해서만 접근 가능
```

사용자가 CloudFront 우회해서 S3 직접 접근 불가. 정적 자산도 보안 경계 안에.

### Lambda 노출

```
Lambda: VPC 밖 (default) but API Gateway 뒤
외부 직접 접근: 차단 (API Gateway 통해서만)
```

Lambda function URL 미사용 — API Gateway HTTP API 가 단일 진입점.

### 알려진 한계 (backlog)

- 정식 로그인 / 회원가입 (bcrypt 비밀번호) 부재 — 현재는 운영자가 mint-token 으로 토큰 발급
- Refresh token rotation 부재 — 토큰 만료 시 재발급 흐름 미구현
- WAF / Rate limiting 부재 (BACK-9 참고)
- Repository multi-step 트랜잭션 부재 (BACK-5, race window)
- Response schema 부재 (BACK-10)
- e2e 보안 테스트 부재 (BACK-13)