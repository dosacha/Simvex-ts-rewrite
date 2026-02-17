import fs from "node:fs";
import path from "node:path";

interface ParsedMigration {
  fileName: string;
  version: number;
  absolutePath: string;
}

function resolveMigrationDir(): string {
  const fromApiRoot = path.resolve(process.cwd(), "db", "migrations");
  if (fs.existsSync(fromApiRoot)) return fromApiRoot;
  return path.resolve(process.cwd(), "apps", "api", "db", "migrations");
}

function parseMigrations(dir: string): ParsedMigration[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^\d+_.*\.sql$/i.test(entry.name))
    .map((entry) => {
      const matched = entry.name.match(/^(\d+)_.*\.sql$/i);
      if (!matched) throw new Error(`유효하지 않은 마이그레이션 파일명: ${entry.name}`);

      return {
        fileName: entry.name,
        version: Number(matched[1]),
        absolutePath: path.join(dir, entry.name),
      };
    })
    .sort((a, b) => a.version - b.version);
}

function validateMigrations(migrations: ParsedMigration[]): void {
  if (migrations.length === 0) {
    throw new Error("마이그레이션 파일이 없음.");
  }

  const seen = new Set<number>();
  let expected = migrations[0]?.version ?? 1;
  for (const migration of migrations) {
    if (seen.has(migration.version)) {
      throw new Error(`중복 버전 감지: ${migration.fileName}`);
    }
    seen.add(migration.version);

    if (migration.version !== expected) {
      throw new Error(`버전 순서 오류: expected=${expected}, actual=${migration.version} (${migration.fileName})`);
    }
    expected += 1;

    const sql = fs.readFileSync(migration.absolutePath, "utf-8").trim();
    if (!sql) throw new Error(`빈 SQL 파일 감지: ${migration.fileName}`);
  }
}

function run() {
  const migrationDir = resolveMigrationDir();
  if (!fs.existsSync(migrationDir)) {
    throw new Error(`마이그레이션 디렉터리를 찾을 수 없음: ${migrationDir}`);
  }

  const migrations = parseMigrations(migrationDir);
  validateMigrations(migrations);

  console.log(`마이그레이션 검증 완료: ${migrations.length}개`);
  console.log(migrations.map((item) => `- ${item.fileName}`).join("\n"));
}

try {
  run();
} catch (error) {
  console.error(error);
  process.exit(1);
}
