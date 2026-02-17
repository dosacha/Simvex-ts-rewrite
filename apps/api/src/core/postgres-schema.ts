import type { Pool } from "pg";

export async function ensurePostgresSchema(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS memos (
      id BIGSERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      model_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ai_histories (
      id BIGSERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      model_id INTEGER NOT NULL,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS workflow_nodes (
      id BIGSERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      x DOUBLE PRECISION NOT NULL,
      y DOUBLE PRECISION NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS workflow_connections (
      id BIGSERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      from_node_id BIGINT NOT NULL,
      to_node_id BIGINT NOT NULL,
      from_anchor TEXT NOT NULL,
      to_anchor TEXT NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS workflow_files (
      id BIGSERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      node_id BIGINT NOT NULL,
      file_name TEXT NOT NULL,
      content_type TEXT NOT NULL,
      data BYTEA NOT NULL
    );
  `);
}
