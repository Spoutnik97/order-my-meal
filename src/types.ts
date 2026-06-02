export interface Salad {
  size: 4 | 6;
  base: string;
  ingredients: string[];
  sauce: string;
  topping: string;
  description: string;
}

export interface UserRow {
  slack_user_id: string;
  team_id: string;
  first_name: string | null;
  last_name: string | null;
  active: number;
  created_at: string;
  bot_token?: string;
}

export interface InstallationRow {
  id: number;
  team_id: string;
  enterprise_id: string | null;
  bot_token: string;
  bot_user_id: string;
  installed_at: string;
}

export interface SuggestionRow {
  id: number;
  slack_user_id: string;
  team_id: string;
  date: string;
  suggestion: string;
  status: 'pending' | 'confirmed' | 'skipped';
  message_ts: string | null;
  ordered_at: string | null;
}

export interface SuggestionWithSalad extends Omit<SuggestionRow, 'suggestion'> {
  suggestion: Salad;
}

export interface PendingSuggestionRow extends SuggestionRow {
  first_name: string | null;
  last_name: string | null;
  bot_token: string;
}
