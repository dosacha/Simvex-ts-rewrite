import fs from "node:fs";
import path from "node:path";
import type { Pool } from "pg";

interface MigrationFile {
  version: string;
  absolutePath: string;
}

function resolveMigrationDir(customDir?: string): string {
  if (customDir) return path.resolve(customDir);

  const candidateFromApiRoot = path.resolve(process.cwd(), "db", "migrations");
  if (fs.existsSync(candidateFromApiRoot)) return candidateFromApiRoot;

  const candidateFromWorkspaceRoot = path.resolve(process.cwd(), "apps", "api", "db", "migrations");
  if (fs.existsSync(candidateFromWorkspaceRoot)) return candidateFromWorkspaceRoot;

  return candidateFromApiRoot;
}

function listMigrationFiles(migrationDir: string): MigrationFile[] {
  if (!fs.existsSync(migrationDir)) return [];

  return fs
    .readdirSync(migrationDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^\d+_.*\.sql$/i.test(entry.name))
    .map((entry) => ({ version: entry.name, absolutePath: path.join(migrationDir, entry.name) }))
    .sort((a, b) => a.version.localeCompare(b.version));
}

export async function runPostgresMigrations(pool: Pool, options?: { migrationDir?: string }): Promise<string[]> {
  const migrationDir = resolveMigrationDir(options?.migrationDir);
  const files = listMigrationFiles(migrationDir);
  if (files.length === 0) return [];

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const appliedRows = await pool.query<{ version: string }>("SELECT version FROM schema_migrations");
  const applied = new Set(appliedRows.rows.map((row) => row.version));
  const appliedNow: string[] = [];

  for (const file of files) {
    if (applied.has(file.version)) continue;

    const sql = fs.readFileSync(file.absolutePath, "utf-8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (version) VALUES ($1)", [file.version]);
      await client.query("COMMIT");
      appliedNow.push(file.version);
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error(`migration failed: ${file.version}`, { cause: error });
    } finally {
      client.release();
    }
  }

  return appliedNow;
}
