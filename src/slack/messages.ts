import type { Salad } from '../types';
import { BASES, INGREDIENTS, SAUCES, TOPPINGS, SIZES } from '../menu';

function todayLabel(): string {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Paris',
  });
}

export function suggestionBlocks(salad: Salad, date?: string) {
  const label = date ?? todayLabel();
  const ingredientsList = salad.ingredients.map(i => `• ${i}`).join('\n');
  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: `🥗 Ta salade du ${label}`, emoji: true },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `_${salad.description}_\n\n*Base :* ${salad.base}\n*Ingrédients (${salad.size}) :*\n${ingredientsList}\n*Sauce :* ${salad.sauce}\n*Topping :* ${salad.topping}`,
      },
    },
    { type: 'divider' },
    {
      type: 'actions',
      elements: [
        { type: 'button', text: { type: 'plain_text', text: '✅ Commander ça !', emoji: true }, style: 'primary', action_id: 'confirm_order' },
        { type: 'button', text: { type: 'plain_text', text: '✏️ Modifier', emoji: true }, action_id: 'customize_order' },
        { type: 'button', text: { type: 'plain_text', text: '🚫 Pas faim', emoji: true }, style: 'danger', action_id: 'skip_order' },
      ],
    },
    { type: 'context', elements: [{ type: 'mrkdwn', text: '⏰ Commande avant 11h00' }] },
  ];
}

export function reminderBlocks() {
  return [
    {
      type: 'section',
      text: { type: 'mrkdwn', text: "⏰ *Rappel !* Tu n'as pas encore confirmé ta commande. Il te reste 30 minutes !" },
    },
    {
      type: 'actions',
      elements: [
        { type: 'button', text: { type: 'plain_text', text: '✅ Commander', emoji: true }, style: 'primary', action_id: 'confirm_order' },
        { type: 'button', text: { type: 'plain_text', text: '✏️ Modifier', emoji: true }, action_id: 'customize_order' },
        { type: 'button', text: { type: 'plain_text', text: '🚫 Pas faim', emoji: true }, style: 'danger', action_id: 'skip_order' },
      ],
    },
  ];
}

export function confirmationBlocks(salad: Salad, firstName: string) {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `✅ *Commande envoyée, ${firstName} !*\nTa salade *${salad.base}* avec ${salad.ingredients.join(', ')} est en route. Bon appétit !`,
      },
    },
  ];
}

export function registrationModal(triggerId: string) {
  return {
    trigger_id: triggerId,
    view: {
      type: 'modal' as const,
      callback_id: 'register_submit',
      title: { type: 'plain_text' as const, text: 'Mon profil', emoji: true },
      submit: { type: 'plain_text' as const, text: 'Enregistrer', emoji: true },
      close: { type: 'plain_text' as const, text: 'Annuler', emoji: true },
      blocks: [
        {
          type: 'section',
          text: { type: 'mrkdwn', text: "Pour que Ferré sache qui commande, j'ai besoin de ton prénom et nom." },
        },
        {
          type: 'input', block_id: 'first_name_block',
          label: { type: 'plain_text' as const, text: 'Prénom', emoji: true },
          element: { type: 'plain_text_input', action_id: 'first_name', placeholder: { type: 'plain_text' as const, text: 'Ex: Marie' } },
        },
        {
          type: 'input', block_id: 'last_name_block',
          label: { type: 'plain_text' as const, text: 'Nom', emoji: true },
          element: { type: 'plain_text_input', action_id: 'last_name', placeholder: { type: 'plain_text' as const, text: 'Ex: Dupont' } },
        },
      ],
    },
  };
}

export function customizeModal(triggerId: string, currentSalad?: Salad) {
  const opt = (val: string) => ({ text: { type: 'plain_text' as const, text: val, emoji: true }, value: val });
  const ingredientOptions = INGREDIENTS.map(opt);
  const baseOptions = BASES.map(opt);
  const sauceOptions = SAUCES.map(opt);
  const toppingOptions = TOPPINGS.map(opt);
  const sizeOptions = SIZES.map(s => ({ text: { type: 'plain_text' as const, text: `${s} ingrédients`, emoji: true }, value: String(s) }));

  return {
    trigger_id: triggerId,
    view: {
      type: 'modal' as const,
      callback_id: 'customize_submit',
      title: { type: 'plain_text' as const, text: 'Ma salade perso', emoji: true },
      submit: { type: 'plain_text' as const, text: 'Commander', emoji: true },
      close: { type: 'plain_text' as const, text: 'Annuler', emoji: true },
      blocks: [
        {
          type: 'input', block_id: 'size_block',
          label: { type: 'plain_text' as const, text: 'Taille', emoji: true },
          element: {
            type: 'static_select', action_id: 'size', options: sizeOptions,
            initial_option: sizeOptions.find(o => o.value === String(currentSalad?.size ?? 4)),
          },
        },
        {
          type: 'input', block_id: 'base_block',
          label: { type: 'plain_text' as const, text: 'Base', emoji: true },
          element: {
            type: 'static_select', action_id: 'base', options: baseOptions,
            initial_option: baseOptions.find(o => o.value === (currentSalad?.base ?? 'salade')),
          },
        },
        {
          type: 'input', block_id: 'ingredients_block',
          label: { type: 'plain_text' as const, text: 'Ingrédients (4 ou 6)', emoji: true },
          hint: { type: 'plain_text' as const, text: 'Sélectionne exactement 4 ou 6 ingrédients' },
          element: {
            type: 'multi_static_select', action_id: 'ingredients', options: ingredientOptions, max_selected_items: 6,
            initial_options: currentSalad?.ingredients.map(i => ingredientOptions.find(o => o.value === i)).filter(Boolean),
          },
        },
        {
          type: 'input', block_id: 'sauce_block',
          label: { type: 'plain_text' as const, text: 'Sauce', emoji: true },
          element: {
            type: 'static_select', action_id: 'sauce', options: sauceOptions,
            initial_option: sauceOptions.find(o => o.value === (currentSalad?.sauce ?? 'vinaigrette')),
          },
        },
        {
          type: 'input', block_id: 'topping_block',
          label: { type: 'plain_text' as const, text: 'Topping', emoji: true },
          element: {
            type: 'static_select', action_id: 'topping', options: toppingOptions,
            initial_option: toppingOptions.find(o => o.value === (currentSalad?.topping ?? 'basilic')),
          },
        },
      ],
    },
  };
}

export function namePromptModal(triggerId: string) {
  return {
    trigger_id: triggerId,
    view: {
      type: 'modal' as const,
      callback_id: 'name_then_order_submit',
      title: { type: 'plain_text' as const, text: 'Dernière étape !', emoji: true },
      submit: { type: 'plain_text' as const, text: 'Confirmer la commande', emoji: true },
      close: { type: 'plain_text' as const, text: 'Annuler', emoji: true },
      blocks: [
        {
          type: 'section',
          text: { type: 'mrkdwn', text: 'Ferré a besoin de ton nom pour préparer la commande.' },
        },
        {
          type: 'input', block_id: 'first_name_block',
          label: { type: 'plain_text' as const, text: 'Prénom', emoji: true },
          element: { type: 'plain_text_input', action_id: 'first_name' },
        },
        {
          type: 'input', block_id: 'last_name_block',
          label: { type: 'plain_text' as const, text: 'Nom', emoji: true },
          element: { type: 'plain_text_input', action_id: 'last_name' },
        },
      ],
    },
  };
}
