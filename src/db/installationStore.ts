import type { InstallationStore, Installation, InstallationQuery } from '@slack/bolt';
import { installations } from './queries';

const installationStore: InstallationStore = {
  storeInstallation: async (installation: Installation) => {
    const teamId = installation.team?.id ?? installation.enterprise?.id;
    if (!teamId) throw new Error('Missing team/enterprise ID in installation');
    const enterpriseId = installation.isEnterpriseInstall ? (installation.enterprise?.id ?? null) : null;
    const bot = installation.bot;
    if (!bot) throw new Error('Missing bot in installation');
    await installations.upsert(teamId, enterpriseId, bot.token, bot.userId);
  },

  fetchInstallation: async (query: InstallationQuery<boolean>): Promise<Installation> => {
    const teamId = query.teamId ?? query.enterpriseId;
    if (!teamId) throw new Error('Missing teamId or enterpriseId in query');
    const row = await installations.fetch(teamId, query.enterpriseId ?? null);
    if (!row) throw new Error(`Installation not found for team ${teamId}`);
    return {
      bot: { token: row.bot_token, userId: row.bot_user_id, scopes: [], id: row.bot_user_id },
      team: { id: row.team_id, name: '' },
      enterprise: undefined,
      isEnterpriseInstall: false,
      user: { token: undefined, id: '', scopes: undefined },
      authVersion: 'v2',
      appId: undefined,
      tokenType: 'bot',
    };
  },
};

export default installationStore;
