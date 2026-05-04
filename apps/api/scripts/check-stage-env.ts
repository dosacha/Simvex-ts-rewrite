const REQUIRED_KEYS = [
  "SIMVEX_REPOSITORY_DRIVER",
  "DATABASE_URL",
  "SIMVEX_CORS_ORIGINS",
  "SIMVEX_JWT_SECRET",
] as const;

// JWT secret 의 최소 길이. server.ts 의 readJwtSecret 과 같은 기준 (HS256 256-bit 방어).
// 동일 정책을 두 자리에 박는 대신 import 하면 깔끔하지만, 이 스크립트는
// app 코드를 끌어들이지 않고 가볍게 점검만 하도록 의도적으로 격리.
const JWT_SECRET_MIN_LENGTH = 32;

function maskDatabaseUrl(url: string): string {
  return url.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:***@");
}

function runCheck() {
  const missing = REQUIRED_KEYS.filter((key) => {
    const value = process.env[key];
    return !value || value.trim().length === 0;
  });

  if (missing.length > 0) {
    console.error("스테이징 리허설 필수 환경변수가 누락됨.");
    for (const key of missing) {
      console.error(`- missing: ${key}`);
    }
    process.exit(1);
  }

  const driver = process.env.SIMVEX_REPOSITORY_DRIVER?.trim().toLowerCase();
  if (driver !== "postgres") {
    console.error("SIMVEX_REPOSITORY_DRIVER는 postgres로 설정해야 함.");
    console.error(`- current: ${process.env.SIMVEX_REPOSITORY_DRIVER}`);
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL ?? "";
  const corsOrigins = process.env.SIMVEX_CORS_ORIGINS ?? "";
  const jwtSecret = process.env.SIMVEX_JWT_SECRET ?? "";

  if (jwtSecret.trim().length < JWT_SECRET_MIN_LENGTH) {
    console.error(`SIMVEX_JWT_SECRET 는 최소 ${JWT_SECRET_MIN_LENGTH}자 이상이어야 함.`);
    console.error(`- current length: ${jwtSecret.trim().length}`);
    process.exit(1);
  }

  console.log("스테이징 리허설 환경변수 점검 통과함.");
  console.log(`- SIMVEX_REPOSITORY_DRIVER: ${driver}`);
  console.log(`- DATABASE_URL: ${maskDatabaseUrl(databaseUrl)}`);
  console.log(`- SIMVEX_CORS_ORIGINS: ${corsOrigins}`);
  // secret 자체는 절대 출력하지 않는다. 길이만 알리면 점검 의미 충분.
  console.log(`- SIMVEX_JWT_SECRET: (길이 ${jwtSecret.trim().length})`);
}

runCheck();