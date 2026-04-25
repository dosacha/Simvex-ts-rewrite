import awsLambdaFastify from "@fastify/aws-lambda";
import { buildServer } from "./server";

// 모듈 로드 시점에 한 번만 빌드 (cold start 시 1회, 이후 재사용)
const appPromise = buildServer().then(async (app) => {
  await app.ready();
  return app;
});

// proxy를 lazy하게 초기화
let proxyPromise: Promise<ReturnType<typeof awsLambdaFastify>> | null = null;

function getProxy() {
  if (!proxyPromise) {
    proxyPromise = appPromise.then((app) =>
      awsLambdaFastify(app, {
        decorateRequest: false,
        serializeLambdaArguments: false,
      }),
    );
  }
  return proxyPromise;
}

export const handler = async (event: unknown, context: unknown) => {
  const proxy = await getProxy();
  // proxy 내부적으로 callback 시그니처를 가지지만, Lambda가 Promise를 반환받아도 잘 처리함
  return new Promise((resolve, reject) => {
    // @ts-expect-error - 라이브러리 타입은 callback 필수지만 Promise도 동작함. 안전을 위해 callback 명시.
    proxy(event, context, (err: Error | null, result: unknown) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};
