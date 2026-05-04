import Fastify from "fastify";
import fastifyJwt from "@fastify/jwt";

/**
 * 개발용 JWT 토큰 발급 스크립트.
 *
 * 용도:
 *   - 로컬에서 API 를 curl / HTTPie 등으로 호출할 때 Authorization 헤더에 넣을 토큰을 만든다.
 *   - 테스트는 자체적으로 app.jwt.sign 을 쓰므로 이 스크립트를 거치지 않는다.
 *
 * 의도적인 한계:
 *   - 정식 로그인 / 회원가입 / 비밀번호는 다루지 않는다 — 그건 별도 기능.
 *   - "이 사용자는 진짜 누군가 인증을 받고 발급받은 토큰" 이 아니라
 *     "내가 명시한 sub 으로 서버 secret 을 써서 서명된 토큰" 일 뿐이다.
 *   - 그래서 절대 production secret 으로 이 스크립트를 돌리지 않는다 — 가드 추가.
 *
 * 사용법:
 *   SIMVEX_JWT_SECRET=... npm run mint-token -w @simvex/api -- <userId> [expiresIn]
 *
 * 예:
 *   SIMVEX_JWT_SECRET=$SIMVEX_JWT_SECRET npm run mint-token -w @simvex/api -- demo-user 7d
 */

async function main() {
  const userId = process.argv[2]?.trim();
  const expiresIn = process.argv[3]?.trim() || "30d";

  if (!userId) {
    console.error("usage: mint-token <userId> [expiresIn=30d]");
    console.error("  ex) mint-token demo-user 7d");
    process.exit(2);
  }

  const secret = process.env.SIMVEX_JWT_SECRET?.trim() ?? "";
  if (secret.length === 0) {
    console.error("SIMVEX_JWT_SECRET 환경 변수가 필요합니다.");
    process.exit(2);
  }
  if (secret.length < 32) {
    console.error("SIMVEX_JWT_SECRET 는 최소 32자 이상이어야 합니다.");
    process.exit(2);
  }

  // production secret 으로 이 스크립트를 돌리는 건 운영 사고 위험.
  // NODE_ENV=production 에서는 명시적으로 거부 — "정말 필요하면 환경 변수 풀고 다시" 라는 의지적 단계.
  if (process.env.NODE_ENV === "production" && process.env.SIMVEX_ALLOW_PROD_TOKEN_MINT !== "1") {
    console.error("production 환경에서 mint-token 사용은 차단됨.");
    console.error("정말 필요하다면 SIMVEX_ALLOW_PROD_TOKEN_MINT=1 을 명시적으로 설정.");
    process.exit(2);
  }

  // Fastify 인스턴스에 @fastify/jwt 를 register 해서 sign 을 쓴다.
  // jsonwebtoken 직접 의존하지 않고 server.ts 와 같은 lib 경로를 거쳐
  // 알고리즘 / 서명 방식이 어긋날 가능성을 차단.
  const app = Fastify({ logger: false });
  await app.register(fastifyJwt, { secret });
  await app.ready();

  const token = app.jwt.sign({ sub: userId }, { expiresIn });

  // stdout 에는 토큰만 — pipe / 변수 대입에 바로 쓸 수 있게.
  process.stdout.write(token + "\n");

  await app.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});