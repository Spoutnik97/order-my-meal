import { Resend } from 'resend';
import type { Salad } from '../types';

const resend = new Resend(process.env.RESEND_API_KEY);

function formatOrder(salad: Salad, firstName: string, lastName: string): string {
  return `Bonjour,

Je souhaite commander une salade (${salad.size} ingrédients) :

- Base : ${salad.base}
- Ingrédients : ${salad.ingredients.join(', ')}
- Sauce : ${salad.sauce}
- Topping : ${salad.topping}

Merci,
${firstName} ${lastName}`;
}

export async function sendOrderEmail(salad: Salad, firstName: string, lastName: string, replyTo?: string): Promise<void> {
  const { error } = await resend.emails.send({
    from: process.env.FROM_EMAIL!,
    to: process.env.RESTAURANT_EMAIL!,
    ...(replyTo && { reply_to: replyTo }),
    subject: `Commande salade - ${firstName} ${lastName}`,
    text: formatOrder(salad, firstName, lastName),
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
}
