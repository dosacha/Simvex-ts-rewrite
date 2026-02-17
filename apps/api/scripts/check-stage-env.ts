const REQUIRED_KEYS = ["SIMVEX_REPOSITORY_DRIVER", "DATABASE_URL", "SIMVEX_CORS_ORIGINS"] as const;

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

  console.log("스테이징 리허설 환경변수 점검 통과함.");
  console.log(`- SIMVEX_REPOSITORY_DRIVER: ${driver}`);
  console.log(`- DATABASE_URL: ${maskDatabaseUrl(databaseUrl)}`);
  console.log(`- SIMVEX_CORS_ORIGINS: ${corsOrigins}`);
}

runCheck();
