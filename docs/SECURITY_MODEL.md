# 보안 모델

기준일: 2026-05-04 (JWT 검증 도입 시점)

## 구현 요약

| 영역 | 현재 구현 |
| --- | --- |
| 인증 (Authentication) | JWT 서명 검증 (HS256, `Authorization: Bearer <token>`) |
| 인가 (Authorization) | repository 의 `user_id` 조건 |
| CORS | 허용 origin 목록 기반 제한 |
| Multipart | auth plugin scope 안에서 register |
| AI 오류 마스킹 | 500 + `meta.error: "ai service unavailable"` |
| 시험 정답 | `answer` 미포함 응답 |
| 파일 업로드 | 파일명 sanitize, 20MB 제한, 소유권 검증 |

## 인증 (Authentication) - 구현됨 (JWT)

```text
헤더: Authorization: Bearer <token>
서명/검증: HS256, secret = SIMVEX_JWT_SECRET (최소 32자)
sub claim = userId
exp claim 검증으로 만료 토큰 자동 거부
```

`@fastify/jwt` 가 서명 / 만료 / 형식을 검증한다. 인증 plugin
(`apps/api/src/interfaces/http/plugins/auth.plugin.ts`) 의 preHandler 가
v2 인증 라우트 register 안에서만 동작하며, 공용 라우트는 토큰 없이 접근 가능하다.
검증 실패 / 헤더 누락 / 서명 불일치 / 만료 / 빈 sub 는 모두 단일 401 메시지로
응답하여 공격자에게 단서를 주지 않는다.

토큰 발급:
- 개발: `npm run mint-token -w @simvex/api -- <userId> [expiresIn]`
- backlog: 정식 로그인 / 회원가입 / refresh token rotation

인증의 두 단계로 분리해 보면:
- **토큰 검증 단계** (verify): 서버 secret 으로 서명된 JWT 만 통과 - 구현됨.
- **신원 증명 단계** (prove): 사용자가 비밀번호로 자기 신원을 1차 증명 - backlog.
  현재는 개발용 mint-token 으로 임의 sub 의 토큰을 발급한다.

## 인가 (Authorization) - 구현됨

```text
권한 격리 = repository 의 user_id 조건
모든 mutating 쿼리는 (user_id = $1 AND ...) 자동 포함
다른 사용자의 자원 조회 시 404 (정보 누설 방지, 403 X)
```

JWT 의 sub claim 이 식별하는 사용자의 자원만 접근 가능하다. repository 가 모든
쿼리에 `user_id` 조건을 자동 포함하여 도메인 로직과 권한 격리를 분리한다.
인증이 그 sub 값을 신뢰할 수 있도록 만들어 주고, 인가가 그 값으로 데이터를
필터링한다.

## CORS

```text
환경 변수: SIMVEX_CORS_ORIGINS (콤마 구분)
미설정 fallback: localhost dev 만 허용
credentials: true (Authorization 헤더 / cookie 포함 허용)
```

허용 origin 을 명시하지 않으면 localhost 개발 주소만 통과시켜 외부 origin 노출을 막는다.

## Multipart 보안 (6단계 fix, commit 15bc460)

```text
register 위치: auth plugin scope 안 (이전엔 밖에서 register)
이유: 미인증 요청이 buffer 적재 전에 401 반환되도록
효과: unauthenticated DoS 방어
```

5단계 narrative cleanup 후 발견된 자리. 6단계 fix 로 "auth plugin scope
안에서 통일" narrative 가 비로소 진실.

## File 업로드 보안

```text
파일명 sanitize: 제어 문자 / 경로 구분자 제거 (file.entity.ts: sanitizeFileName)
크기 제한: 20MB (server.ts: multipart fileSize)
응답: id + fileName + URL 만 노출 (buffer 절대 노출 안 함)
다운로드: 파일 소유권 검증 후 응답
```

## AI 오류 마스킹

```text
응답: 500 + meta.error: "ai service unavailable"
```

외부 AI 연동 실패 원인을 그대로 노출하지 않고, 클라이언트에는 공통 메시지와
고정된 `meta.error` 값만 반환한다.

## 알려진 한계 (backlog)

- 정식 로그인 / 회원가입 (bcrypt 비밀번호 해싱, users 테이블, login endpoint) 부재
- Refresh token rotation + revocation list 부재
- Repository multi-step 트랜잭션 부재 (`createConnection` 등의 race window 보호)
- Response schema 부재 (현재 입력 schema 만 도입, memo v2 만 일부 도입됨)
- e2e 보안 테스트 부재 (dockerized postgres 통합)
