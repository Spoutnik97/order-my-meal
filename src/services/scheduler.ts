import cron from 'node-cron';
import { WebClient } from '@slack/web-api';
import { users, suggestions } from '../db/queries';
import { suggestSalad } from './claude';
import { suggestionBlocks, reminderBlocks } from '../slack/messages';

function todayDate(): string {
  return new Date().toLocaleDateString('fr-CA', { timeZone: 'Europe/Paris' });
}

function todayLabel(): string {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Paris',
  });
}

async function sendDailySuggestions(): Promise<void> {
  const activeUsers = users.allActive();
  if (activeUsers.length === 0) return;

  const date = todayDate();

  for (const user of activeUsers) {
    try {
      const salad = await suggestSalad();
      const client = new WebClient(user.bot_token);

      const result = await client.chat.postMessage({
        channel: user.slack_user_id,
        blocks: suggestionBlocks(salad, todayLabel()),
        text: `Ta suggestion de salade du ${todayLabel()}`,
      });

      suggestions.upsert(user.slack_user_id, user.team_id, date, salad, result.ts ?? null);
      console.log(`Suggestion sent to ${user.slack_user_id} (${user.first_name})`);
    } catch (err) {
      console.error(`Failed to send suggestion to ${user.slack_user_id}:`, (err as Error).message);
    }
  }
}

async function sendReminders(): Promise<void> {
  const date = todayDate();
  const pending = suggestions.pendingForDate(date);

  for (const record of pending) {
    try {
      const client = new WebClient(record.bot_token);
      await client.chat.postMessage({
        channel: record.slack_user_id,
        blocks: reminderBlocks(),
        text: "⏰ Rappel : tu n'as pas encore commandé ta salade !",
      });
    } catch (err) {
      console.error(`Failed to send reminder to ${record.slack_user_id}:`, (err as Error).message);
    }
  }
}

export function start(): void {
  cron.schedule('0 10 * * 1-5', sendDailySuggestions, { timezone: 'Europe/Paris' });
  cron.schedule('30 10 * * 1-5', sendReminders, { timezone: 'Europe/Paris' });
  console.log('Scheduler started (10:00 suggestions, 10:30 reminders, weekdays)');
}

export { sendDailySuggestions, sendReminders };
