import type { FastifyInstance } from "fastify";
import { buildStudyBundle, buildStudyCatalog, getCatalogStore } from "../../core/catalog";

export async function registerStudyRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { domain?: string } }>("/api/study/catalog", async (request, reply) => {
    const domainKey = request.query.domain?.trim();
    if (!domainKey) return reply.code(400).send({ message: "domain 쿼리 파라미터가 필요합니다." });

    return buildStudyCatalog(domainKey);
  });

  app.get<{ Params: { domainKey: string; categoryKey: string } }>(
    "/api/study/:domainKey/:categoryKey/models",
    async (request) => {
      const { domainKey, categoryKey } = request.params;
      return getCatalogStore().models.filter(
        (model) => model.domainKey === domainKey && model.categoryKey === categoryKey,
      );
    },
  );

  app.get<{ Params: { domainKey: string; categoryKey: string; modelSlug: string } }>(
    "/api/study/:domainKey/:categoryKey/:modelSlug/bundle",
    async (request, reply) => {
      const { domainKey, categoryKey, modelSlug } = request.params;
      const bundle = buildStudyBundle(domainKey, categoryKey, modelSlug);

      if (!bundle) return reply.code(404).send({ message: "학습 번들을 찾을 수 없습니다." });
      return bundle;
    },
  );
}
