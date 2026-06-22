import pool from './setup';
import type { Salad, UserRow, InstallationRow, SuggestionWithSalad, PendingSuggestionRow } from '../types';

export const installations = {
  async upsert(teamId: string, enterpriseId: string | null, botToken: string, botUserId: string): Promise<void> {
    await pool.query(
      `INSERT INTO installations (team_id, enterprise_id, bot_token, bot_user_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (team_id, enterprise_id) DO UPDATE SET bot_token = EXCLUDED.bot_token, bot_user_id = EXCLUDED.bot_user_id`,
      [teamId, enterpriseId, botToken, botUserId]
    );
  },

  async fetch(teamId: string, enterpriseId: string | null): Promise<InstallationRow | undefined> {
    const result = await pool.query<InstallationRow>(
      'SELECT * FROM installations WHERE team_id = $1 AND (enterprise_id = $2 OR enterprise_id IS NULL)',
      [teamId, enterpriseId]
    );
    return result.rows[0];
  },
};

export const users = {
  async upsert(slackUserId: string, teamId: string, firstName: string, lastName: string): Promise<void> {
    await pool.query(
      `INSERT INTO users (slack_user_id, team_id, first_name, last_name)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (slack_user_id, team_id) DO UPDATE SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, active = TRUE`,
      [slackUserId, teamId, firstName, lastName]
    );
  },

  async get(slackUserId: string, teamId: string): Promise<UserRow | undefined> {
    const result = await pool.query<UserRow>(
      'SELECT * FROM users WHERE slack_user_id = $1 AND team_id = $2',
      [slackUserId, teamId]
    );
    return result.rows[0];
  },

  async setActive(slackUserId: string, teamId: string, active: boolean): Promise<void> {
    await pool.query(
      'UPDATE users SET active = $1 WHERE slack_user_id = $2 AND team_id = $3',
      [active, slackUserId, teamId]
    );
  },

  async allActive(): Promise<UserRow[]> {
    const result = await pool.query<UserRow>(
      'SELECT u.*, i.bot_token FROM users u JOIN installations i ON u.team_id = i.team_id WHERE u.active = TRUE'
    );
    return result.rows;
  },
};

export const suggestions = {
  async upsert(slackUserId: string, teamId: string, date: string, salad: Salad, messageTs: string | null): Promise<void> {
    await pool.query(
      `INSERT INTO daily_suggestions (slack_user_id, team_id, date, suggestion, message_ts)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (slack_user_id, team_id, date) DO UPDATE SET suggestion = EXCLUDED.suggestion, message_ts = EXCLUDED.message_ts, status = 'pending'`,
      [slackUserId, teamId, date, JSON.stringify(salad), messageTs]
    );
  },

  async get(slackUserId: string, teamId: string, date: string): Promise<SuggestionWithSalad | undefined> {
    const result = await pool.query<{ suggestion: string } & Omit<SuggestionWithSalad, 'suggestion'>>(
      'SELECT * FROM daily_suggestions WHERE slack_user_id = $1 AND team_id = $2 AND date = $3',
      [slackUserId, teamId, date]
    );
    const row = result.rows[0];
    if (!row) return undefined;
    return { ...row, suggestion: JSON.parse(row.suggestion) as Salad };
  },

  async setStatus(slackUserId: string, teamId: string, date: string, status: 'confirmed' | 'skipped'): Promise<void> {
    await pool.query(
      'UPDATE daily_suggestions SET status = $1, ordered_at = NOW() WHERE slack_user_id = $2 AND team_id = $3 AND date = $4',
      [status, slackUserId, teamId, date]
    );
  },

  async recentForUser(slackUserId: string, teamId: string, days: number): Promise<Salad[]> {
    const result = await pool.query<{ suggestion: string }>(
      `SELECT suggestion FROM daily_suggestions
       WHERE slack_user_id = $1 AND team_id = $2
       AND date >= CURRENT_DATE - ($3 * INTERVAL '1 day')
       ORDER BY date DESC`,
      [slackUserId, teamId, days]
    );
    return result.rows.map(r => JSON.parse(r.suggestion) as Salad);
  },

  async pendingForDate(date: string): Promise<PendingSuggestionRow[]> {
    const result = await pool.query<PendingSuggestionRow>(
      `SELECT ds.*, u.first_name, u.last_name, i.bot_token
       FROM daily_suggestions ds
       JOIN users u ON ds.slack_user_id = u.slack_user_id AND ds.team_id = u.team_id
       JOIN installations i ON ds.team_id = i.team_id
       WHERE ds.date = $1 AND ds.status = 'pending'`,
      [date]
    );
    return result.rows;
  },
};
