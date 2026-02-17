import { Pool } from "pg";

async function runDbSmoke() {
  const databaseUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL 또는 POSTGRES_URL 환경변수가 필요함.");
  }

  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const ping = await pool.query<{ now: string }>("SELECT NOW()::text AS now");
    const now = ping.rows[0]?.now ?? "unknown";

    const migrationTable = await pool.query<{ exists: boolean }>(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'schema_migrations'
      ) AS "exists"
    `);
    const hasMigrationTable = migrationTable.rows[0]?.exists ?? false;
    if (!hasMigrationTable) {
      throw new Error("schema_migrations 테이블이 없음. migrate를 먼저 실행해야 함.");
    }

    const appliedCountResult = await pool.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM schema_migrations");
    const appliedCount = Number(appliedCountResult.rows[0]?.count ?? "0");

    const latestResult = await pool.query<{ version: string }>(
      "SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1",
    );
    const latest = latestResult.rows[0]?.version ?? "(none)";

    console.log("DB smoke check 통과함.");
    console.log(`- db_now: ${now}`);
    console.log(`- applied_migrations: ${appliedCount}`);
    console.log(`- latest_migration: ${latest}`);
  } finally {
    await pool.end();
  }
}

runDbSmoke().catch((error) => {
  console.error(error);
  process.exit(1);
});
