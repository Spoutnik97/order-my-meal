import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'ferre.sqlite'));

db.exec(`
  CREATE TABLE IF NOT EXISTS installations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id TEXT NOT NULL,
    enterprise_id TEXT,
    bot_token TEXT NOT NULL,
    bot_user_id TEXT NOT NULL,
    installed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, enterprise_id)
  );

  CREATE TABLE IF NOT EXISTS users (
    slack_user_id TEXT NOT NULL,
    team_id TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (slack_user_id, team_id)
  );

  CREATE TABLE IF NOT EXISTS daily_suggestions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slack_user_id TEXT NOT NULL,
    team_id TEXT NOT NULL,
    date TEXT NOT NULL,
    suggestion TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    message_ts TEXT,
    ordered_at DATETIME,
    UNIQUE(slack_user_id, team_id, date)
  );
`);

export default db;
