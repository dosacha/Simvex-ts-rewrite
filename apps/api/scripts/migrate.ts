import { Pool } from "pg";
import { runPostgresMigrations } from "../src/core/postgres-migrations";

async function runMigrate() {
  const databaseUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL 또는 POSTGRES_URL 환경변수가 필요함.");
  }

  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const applied = await runPostgresMigrations(pool);
    if (applied.length === 0) {
      console.log("적용할 마이그레이션 없음.");
    } else {
      console.log(`적용된 마이그레이션: ${applied.join(", ")}`);
    }
  } finally {
    await pool.end();
  }
}

runMigrate().catch((error) => {
  console.error(error);
  process.exit(1);
});
