import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS installations (
      id SERIAL PRIMARY KEY,
      team_id TEXT NOT NULL,
      enterprise_id TEXT,
      bot_token TEXT NOT NULL,
      bot_user_id TEXT NOT NULL,
      installed_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE NULLS NOT DISTINCT (team_id, enterprise_id)
    );

    CREATE TABLE IF NOT EXISTS users (
      slack_user_id TEXT NOT NULL,
      team_id TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (slack_user_id, team_id)
    );

    CREATE TABLE IF NOT EXISTS daily_suggestions (
      id SERIAL PRIMARY KEY,
      slack_user_id TEXT NOT NULL,
      team_id TEXT NOT NULL,
      date TEXT NOT NULL,
      suggestion TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      message_ts TEXT,
      ordered_at TIMESTAMPTZ,
      UNIQUE (slack_user_id, team_id, date)
    );
  `);
}

export default pool;
