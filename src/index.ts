import 'dotenv/config';
import { App } from '@slack/bolt';
import installationStore from './db/installationStore';
import { initDb } from './db/setup';
import * as scheduler from './services/scheduler';
import {
  handleConfirmOrder,
  handleCustomizeOrder,
  handleSkipOrder,
  handleCustomizeSubmit,
  handleRegisterSubmit,
  handleNameThenOrderSubmit,
  handleSubscribeCommand,
  handleUnsubscribeCommand,
} from './slack/handlers';
import { registrationModal } from './slack/messages';

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET!,
  clientId: process.env.SLACK_CLIENT_ID!,
  clientSecret: process.env.SLACK_CLIENT_SECRET!,
  stateSecret: process.env.SLACK_STATE_SECRET!,
  scopes: ['chat:write', 'im:write', 'commands'],
  installationStore,
});

app.action('confirm_order', handleConfirmOrder);
app.action('customize_order', handleCustomizeOrder);
app.action('skip_order', handleSkipOrder);

app.view('customize_submit', handleCustomizeSubmit);
app.view('register_submit', handleRegisterSubmit);
app.view('name_then_order_submit', handleNameThenOrderSubmit);

app.command('/salade', handleSubscribeCommand);
app.command('/salade-stop', handleUnsubscribeCommand);

app.event('app_home_opened', async ({ event, client }) => {
  try {
    await client.views.publish({
      user_id: event.user,
      view: {
        type: 'home',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Bienvenue sur Ferré Order ! 🥗*\nJe te propose chaque matin (lun-ven à 10h) une salade et je commande pour toi avant 11h.',
            },
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: { type: 'plain_text', text: "S'inscrire aux suggestions", emoji: true },
                style: 'primary',
                action_id: 'open_register',
              },
            ],
          },
        ],
      },
    });
  } catch (err: unknown) {
    if ((err as { data?: { error?: string } }).data?.error !== 'not_enabled') throw err;
  }
});

app.action('open_register', async ({ body, client, ack }) => {
  await ack();
  const trigger = (body as { trigger_id?: string }).trigger_id;
  if (trigger) await client.views.open(registrationModal(trigger));
});

(async () => {
  await initDb();
  const port = parseInt(process.env.PORT ?? '3000');
  await app.start(port);
  console.log(`⚡ Ferré Order bot running on port ${port}`);
  scheduler.start();
})();
