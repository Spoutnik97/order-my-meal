import type {
  BlockAction,
  SlashCommand,
  ViewSubmitAction,
  AllMiddlewareArgs,
  SlackActionMiddlewareArgs,
  SlackViewMiddlewareArgs,
  SlackCommandMiddlewareArgs,
} from '@slack/bolt';
import { users, suggestions } from '../db/queries';
import { sendOrderEmail } from '../services/email';
import type { Salad } from '../types';
import {
  confirmationBlocks,
  registrationModal,
  customizeModal,
  namePromptModal,
} from './messages';

type ActionArgs = SlackActionMiddlewareArgs<BlockAction> & AllMiddlewareArgs;
type ViewArgs = SlackViewMiddlewareArgs<ViewSubmitAction> & AllMiddlewareArgs;
type CommandArgs = SlackCommandMiddlewareArgs & AllMiddlewareArgs;

function todayDate(): string {
  return new Date().toLocaleDateString('fr-CA', { timeZone: 'Europe/Paris' });
}

function teamId(body: BlockAction | ViewSubmitAction | SlashCommand): string {
  return (body as BlockAction).team?.id ?? (body as { user: { team_id?: string } }).user?.team_id ?? '';
}

export async function handleConfirmOrder({ body, client, ack }: ActionArgs): Promise<void> {
  await ack();
  const userId = body.user.id;
  const tid = teamId(body);
  const user = await users.get(userId, tid);

  if (!user?.first_name) {
    await client.views.open(namePromptModal(body.trigger_id));
    return;
  }

  const record = await suggestions.get(userId, tid, todayDate());
  if (!record || record.status !== 'pending') return;

  await sendOrderEmail(record.suggestion, user.first_name, user.last_name!);
  await suggestions.setStatus(userId, tid, todayDate(), 'confirmed');

  const b = body as BlockAction & { container: { channel_id: string; message_ts: string } };
  await client.chat.update({
    channel: b.channel?.id ?? b.container.channel_id,
    ts: b.message?.ts ?? b.container.message_ts,
    blocks: confirmationBlocks(record.suggestion, user.first_name),
    text: `Commande envoyée pour ${user.first_name} !`,
  });
}

export async function handleCustomizeOrder({ body, client, ack }: ActionArgs): Promise<void> {
  await ack();
  const record = await suggestions.get(body.user.id, teamId(body), todayDate());
  await client.views.open(customizeModal(body.trigger_id, record?.suggestion));
}

export async function handleSkipOrder({ body, client, ack }: ActionArgs): Promise<void> {
  await ack();
  const userId = body.user.id;
  const tid = teamId(body);
  await suggestions.setStatus(userId, tid, todayDate(), 'skipped');

  const b = body as BlockAction & { container: { channel_id: string; message_ts: string } };
  await client.chat.update({
    channel: b.channel?.id ?? b.container.channel_id,
    ts: b.message?.ts ?? b.container.message_ts,
    blocks: [{ type: 'section', text: { type: 'mrkdwn', text: "😴 Pas de commande aujourd'hui. À demain !" } }],
    text: 'Commande annulée.',
  });
}

export async function handleCustomizeSubmit({ body, view, client, ack }: ViewArgs): Promise<void> {
  const values = view.state.values;
  const size = parseInt(values.size_block.size.selected_option?.value ?? '4');
  const ingredients = (values.ingredients_block.ingredients.selected_options ?? []).map(o => o.value);

  if (ingredients.length !== 4 && ingredients.length !== 6) {
    await ack({ response_action: 'errors', errors: { ingredients_block: 'Sélectionne exactement 4 ou 6 ingrédients.' } });
    return;
  }
  if (ingredients.length !== size) {
    await ack({ response_action: 'errors', errors: { size_block: `Tu as sélectionné ${ingredients.length} ingrédients mais choisi la taille ${size}.` } });
    return;
  }
  await ack();

  const userId = body.user.id;
  const tid = teamId(body);
  const user = await users.get(userId, tid);

  const salad: Salad = {
    size: size as 4 | 6,
    base: values.base_block.base.selected_option?.value ?? '',
    ingredients,
    sauce: values.sauce_block.sauce.selected_option?.value ?? '',
    topping: values.topping_block.topping.selected_option?.value ?? '',
    description: 'Ta salade personnalisée',
  };

  const record = await suggestions.get(userId, tid, todayDate());
  if (record) await suggestions.upsert(userId, tid, todayDate(), salad, record.message_ts);

  if (!user?.first_name) {
    await client.views.open(namePromptModal(body.trigger_id));
    return;
  }

  await sendOrderEmail(salad, user.first_name, user.last_name!);
  await suggestions.setStatus(userId, tid, todayDate(), 'confirmed');

  await client.chat.postMessage({
    channel: userId,
    blocks: confirmationBlocks(salad, user.first_name),
    text: `Commande envoyée pour ${user.first_name} !`,
  });
}

export async function handleRegisterSubmit({ body, view, client, ack }: ViewArgs): Promise<void> {
  const values = view.state.values;
  const firstName = values.first_name_block.first_name.value?.trim() ?? '';
  const lastName = values.last_name_block.last_name.value?.trim() ?? '';

  if (!firstName || !lastName) {
    await ack({
      response_action: 'errors',
      errors: {
        ...(!firstName && { first_name_block: 'Requis' }),
        ...(!lastName && { last_name_block: 'Requis' }),
      },
    });
    return;
  }
  await ack();
  await users.upsert(body.user.id, teamId(body), firstName, lastName);
  await client.chat.postMessage({
    channel: body.user.id,
    text: `✅ Bienvenue ${firstName} ! Tu recevras une suggestion de salade chaque matin (lun-ven à 10h). Tu peux te désinscrire à tout moment avec \`/salade-stop\`.`,
  });
}

export async function handleNameThenOrderSubmit({ body, view, client, ack }: ViewArgs): Promise<void> {
  const values = view.state.values;
  const firstName = values.first_name_block.first_name.value?.trim() ?? '';
  const lastName = values.last_name_block.last_name.value?.trim() ?? '';

  if (!firstName || !lastName) {
    await ack({
      response_action: 'errors',
      errors: {
        ...(!firstName && { first_name_block: 'Requis' }),
        ...(!lastName && { last_name_block: 'Requis' }),
      },
    });
    return;
  }
  await ack();

  const userId = body.user.id;
  const tid = teamId(body);
  await users.upsert(userId, tid, firstName, lastName);

  const record = await suggestions.get(userId, tid, todayDate());
  if (!record || record.status !== 'pending') {
    await client.chat.postMessage({ channel: userId, text: "Aucune commande en attente pour aujourd'hui." });
    return;
  }

  await sendOrderEmail(record.suggestion, firstName, lastName);
  await suggestions.setStatus(userId, tid, todayDate(), 'confirmed');

  await client.chat.postMessage({
    channel: userId,
    blocks: confirmationBlocks(record.suggestion, firstName),
    text: `Commande envoyée pour ${firstName} !`,
  });
}

export async function handleSubscribeCommand({ command, client, ack }: CommandArgs): Promise<void> {
  await ack();
  const user = await users.get(command.user_id, command.team_id);

  if (!user?.first_name) {
    await client.views.open(registrationModal(command.trigger_id));
    return;
  }

  await users.setActive(command.user_id, command.team_id, true);
  await client.chat.postMessage({
    channel: command.user_id,
    text: `✅ Tu es inscrit(e) pour les suggestions quotidiennes, ${user.first_name} !`,
  });
}

export async function handleUnsubscribeCommand({ command, client, ack }: CommandArgs): Promise<void> {
  await ack();
  await users.setActive(command.user_id, command.team_id, false);
  await client.chat.postMessage({
    channel: command.user_id,
    text: "👋 Tu ne recevras plus de suggestions quotidiennes.",
  });
}
