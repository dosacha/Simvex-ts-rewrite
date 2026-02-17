import { Pool } from "pg";
import { ensurePostgresSchema } from "../src/core/postgres-schema";

async function runMigrate() {
  const databaseUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL 또는 POSTGRES_URL 환경변수가 필요함.");
  }

  const pool = new Pool({ connectionString: databaseUrl });
  try {
    await ensurePostgresSchema(pool);
    console.log("PostgreSQL migration 완료함.");
  } finally {
    await pool.end();
  }
}

runMigrate().catch((error) => {
  console.error(error);
  process.exit(1);
});
