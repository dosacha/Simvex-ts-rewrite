import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import "@fastify/jwt";

/**
 * FastifyRequest 에 userId 필드를 추가.
 * preHandler 에서 인증 통과 시점에 채워지고, controller 는 이걸 신뢰해서 사용한다.
 */
declare module "fastify" {
  interface FastifyRequest {
    userId: string;
  }
}

/**
 * @fastify/jwt 의 payload / user 타입을 명시.
 *
 *   payload  = sign 의 입력 (토큰 발급 시)
 *   user     = jwtVerify 후 request.user 에 들어가는 검증된 페이로드
 *
 * sub (subject) = JWT 표준 claim. userId 를 담는 자리.
 *  - 표준이 정해놓은 식별자 자리라 자체 키 (예: "userId") 발명하지 않음.
 *  - controller 는 request.userId 만 본다 — claim 이름은 plugin 안에 가둠.
 */
declare module "@fastify/jwt" {
  interface FastifyJWT {
    // 표준 claim 들 (iat, exp, nbf) 은 lib 가 자동 채워주기도 하고 직접 명시도 가능.
    // optional 로 둬서 두 경로 모두 허용 — 테스트의 "expired token" 시나리오 등에서 직접 exp 지정.
    payload: { sub: string; iat?: number; exp?: number; nbf?: number };
    user: { sub: string; iat?: number; exp?: number; nbf?: number };
  }
}

/**
 * 인증 plugin (JWT).
 *
 * 책임:
 *   - Authorization: Bearer <token> 헤더의 JWT 를 검증한다 (@fastify/jwt 사용).
 *   - 서명 / exp / 형식 중 어느 하나라도 어긋나면 401 로 즉시 종료.
 *   - 통과하면 토큰의 sub claim 을 request.userId 에 주입한다.
 *
 * 비책임:
 *   - 토큰 발급 (mint-token script 또는 향후 login endpoint 책임)
 *   - 권한 검사 — 그건 repository 의 user_id 조건 (인가, authorization)
 *
 * 적용 범위:
 *   - server.ts 의 v2 인증 라우트 register 안에서 register 한다.
 *   - 그 register 가 fastify encapsulation 으로 감싸져 있어,
 *     공용 라우트 (/api/v2/models 등) 에는 이 hook 이 적용되지 않는다.
 *
 * 전제:
 *   - server.ts 가 @fastify/jwt 를 app 레벨에 register 해 둔 상태.
 *     (request.jwtVerify / app.jwt.sign 가 사용 가능해야 함)
 */
export async function registerAuthPlugin(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      // 헤더 없음 / 토큰 파싱 실패 / 서명 불일치 / 만료 — 모두 동일 응답.
      // 차이를 노출하면 공격자에게 단서 줄 수 있어 의도적으로 한 가지 메시지로 통일.
      return reply.code(401).send({ message: "인증이 필요합니다." });
    }

    const sub = request.user.sub;
    const exp = request.user.exp;

    // sub 은 declare module 로 string 으로 타이핑돼 있지만,
    // 외부에서 발급된 토큰일 수 있어 런타임에서도 한번 더 방어.
    if (typeof sub !== "string" || sub.trim().length === 0) {
      return reply.code(401).send({ message: "인증 정보가 유효하지 않습니다." });
    }

    // exp 는 의도적으로 plugin 이 강제한다.
    //
    // @fastify/jwt 의 jwtVerify 는 exp 가 "있을 때만" 만료를 검사한다 — 즉 exp 없이 발급된
    // 토큰은 영구 토큰이 되어 통과한다. 토큰이 한 번 유출되면 영구히 도용당하는 자리.
    // 토큰 발급자 (mint-token, 향후 login endpoint) 가 깜빡 잊어도 검증 단계에서 차단한다.
    //
    // exp 가 과거인 케이스는 이미 jwtVerify() 가 던져서 위 catch 에서 처리됨.
    // 여기는 "exp 자체가 없는" 케이스만 추가로 막는다.
    if (typeof exp !== "number") {
      return reply.code(401).send({ message: "인증 정보가 유효하지 않습니다." });
    }

    request.userId = sub.trim();
  });
}