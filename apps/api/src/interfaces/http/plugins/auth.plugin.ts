import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

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
 * 인증 plugin.
 *
 * 책임:
 *   - x-user-id 헤더 1개를 읽는다.
 *   - 비어 있으면 401 로 즉시 종료한다 (default-guest fallback 없음).
 *   - 통과하면 request.userId 에 trimmed 값을 주입한다.
 *
 * 비책임:
 *   - 토큰 검증 / 세션 조회 / 권한 검사 — 현재는 MVP 단계 헤더 기반 식별자.
 *     추후 JWT / 세션으로 교체 시 이 plugin 만 바꾸면 된다.
 *
 * 적용 범위:
 *   - server.ts 의 v2 라우트 register 안에서 register 한다.
 *   - legacy /api/study, /api/workflow 는 적용 대상이 아니다.
 */
export async function registerAuthPlugin(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", async (request: FastifyRequest, reply: FastifyReply) => {
    const raw = request.headers["x-user-id"];

    // 헤더가 배열로 들어오는 케이스 (Fastify 가 동일 헤더 여러 개 받았을 때) 는 거부.
    if (Array.isArray(raw)) {
      return reply.code(401).send({ message: "인증 정보가 유효하지 않습니다." });
    }

    const userId = typeof raw === "string" ? raw.trim() : "";
    if (userId.length === 0) {
      return reply.code(401).send({ message: "인증이 필요합니다." });
    }

    request.userId = userId;
  });
}