import { sendEmail } from '@/utils/email/service';
import { EventHandlerResult } from '../../index';

export async function notifyByMail(evt: any): Promise<EventHandlerResult>  {


  // 1. Intentar obtener el destinatario del evento
  const recipient = evt.recipient;

  if (!recipient) {
    // 2. Si no hay destinatario ni MAIL_RECIPIENTS, notificar a los admins
    const admins = process.env.MAIL_ADMINS;
    if (admins) {
      await sendEmail({
        to: admins,
        subject: `[Stripe][ERROR] No se pudo enviar notificación de evento: ${evt.type}`,
        textBody: `No se encontró destinatario para el evento.\n\nEvento:\n${JSON.stringify(evt, null, 2)}`,
      });
    }
    throw new Error('No se encontró destinatario para el evento y no se pudo notificar a los administradores.');
  }

  await sendEmail({
    to: recipient,
    subject: `[Stripe] ${evt.type}`,
    textBody: JSON.stringify(
      {
        id: evt.id,
        type: evt.type,
        created: new Date(evt.created * 1000).toISOString(),
        objectId: evt.data?.object?.id ?? null,
        amount: evt.data?.object?.amount ?? null,
        currency: evt.data?.object?.currency ?? null,
      },
      null,
      2
    ),
  });

  return { success: true };
}
