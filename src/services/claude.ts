import Anthropic from '@anthropic-ai/sdk';
import { BASES, INGREDIENTS, SAUCES, TOPPINGS } from '../menu';
import type { Salad } from '../types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function suggestSalad(): Promise<Salad> {
  const prompt = `Tu es un chef cuisinier expert en salades composées. Propose une salade savoureuse et équilibrée pour le déjeuner.

Choisis parmi ces options :
- Base : ${BASES.join(', ')}
- Ingrédients disponibles : ${INGREDIENTS.join(', ')}
- Sauce : ${SAUCES.join(', ')}
- Topping : ${TOPPINGS.join(', ')}

Règles :
- Choisis soit 4 soit 6 ingrédients (4 si la combinaison est simple et cohérente, 6 si tu veux quelque chose de généreux)
- Les ingrédients doivent bien se marier ensemble (ex: évite sardines + mozzarella)
- Pense à l'équilibre protéines / légumes

Réponds UNIQUEMENT en JSON valide, sans markdown :
{
  "size": 4,
  "base": "quinoa",
  "ingredients": ["thon", "avocat", "concombres", "tomates"],
  "sauce": "citron",
  "topping": "coriandre",
  "description": "Une phrase courte et appétissante décrivant la salade"
}`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = (message.content[0] as { text: string }).text.trim();
  return JSON.parse(raw) as Salad;
}
