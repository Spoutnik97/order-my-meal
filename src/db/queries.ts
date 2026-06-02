import db from './setup';
import type { Salad, UserRow, InstallationRow, SuggestionWithSalad, PendingSuggestionRow } from '../types';

export const installations = {
  upsert(teamId: string, enterpriseId: string | null, botToken: string, botUserId: string): void {
    db.prepare(`
      INSERT INTO installations (team_id, enterprise_id, bot_token, bot_user_id)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(team_id, enterprise_id) DO UPDATE SET bot_token=excluded.bot_token, bot_user_id=excluded.bot_user_id
    `).run(teamId, enterpriseId, botToken, botUserId);
  },

  fetch(teamId: string, enterpriseId: string | null): InstallationRow | undefined {
    return db.prepare<[string, string | null], InstallationRow>(
      'SELECT * FROM installations WHERE team_id = ? AND (enterprise_id = ? OR enterprise_id IS NULL)'
    ).get(teamId, enterpriseId);
  },
};

export const users = {
  upsert(slackUserId: string, teamId: string, firstName: string, lastName: string): void {
    db.prepare(`
      INSERT INTO users (slack_user_id, team_id, first_name, last_name)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(slack_user_id, team_id) DO UPDATE SET first_name=excluded.first_name, last_name=excluded.last_name, active=1
    `).run(slackUserId, teamId, firstName, lastName);
  },

  get(slackUserId: string, teamId: string): UserRow | undefined {
    return db.prepare<[string, string], UserRow>(
      'SELECT * FROM users WHERE slack_user_id = ? AND team_id = ?'
    ).get(slackUserId, teamId);
  },

  setActive(slackUserId: string, teamId: string, active: boolean): void {
    db.prepare('UPDATE users SET active = ? WHERE slack_user_id = ? AND team_id = ?')
      .run(active ? 1 : 0, slackUserId, teamId);
  },

  allActive(): UserRow[] {
    return db.prepare<[], UserRow>(
      'SELECT u.*, i.bot_token FROM users u JOIN installations i ON u.team_id = i.team_id WHERE u.active = 1'
    ).all();
  },
};

export const suggestions = {
  upsert(slackUserId: string, teamId: string, date: string, salad: Salad, messageTs: string | null): void {
    db.prepare(`
      INSERT INTO daily_suggestions (slack_user_id, team_id, date, suggestion, message_ts)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(slack_user_id, team_id, date) DO UPDATE SET suggestion=excluded.suggestion, message_ts=excluded.message_ts, status='pending'
    `).run(slackUserId, teamId, date, JSON.stringify(salad), messageTs);
  },

  get(slackUserId: string, teamId: string, date: string): SuggestionWithSalad | undefined {
    const row = db.prepare<[string, string, string], { suggestion: string } & Omit<SuggestionWithSalad, 'suggestion'>>(
      'SELECT * FROM daily_suggestions WHERE slack_user_id = ? AND team_id = ? AND date = ?'
    ).get(slackUserId, teamId, date);
    if (!row) return undefined;
    return { ...row, suggestion: JSON.parse(row.suggestion) as Salad };
  },

  setStatus(slackUserId: string, teamId: string, date: string, status: 'confirmed' | 'skipped'): void {
    db.prepare(
      'UPDATE daily_suggestions SET status = ?, ordered_at = CURRENT_TIMESTAMP WHERE slack_user_id = ? AND team_id = ? AND date = ?'
    ).run(status, slackUserId, teamId, date);
  },

  pendingForDate(date: string): PendingSuggestionRow[] {
    return db.prepare<[string], PendingSuggestionRow>(`
      SELECT ds.*, u.first_name, u.last_name, i.bot_token
      FROM daily_suggestions ds
      JOIN users u ON ds.slack_user_id = u.slack_user_id AND ds.team_id = u.team_id
      JOIN installations i ON ds.team_id = i.team_id
      WHERE ds.date = ? AND ds.status = 'pending'
    `).all(date);
  },
};
