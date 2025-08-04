// Eliminar imports que causan errores por paths alias no resueltos
// import { createAdminClient } from '@/utils/supabase/admin';
// import { EmailSender } from '@/utils/email/sender';
// import { ResendAdapter } from '@/utils/email/resendAdapter';
// import ConfirmEmailES from '@/templates/mails/confirm.es';
// import ConfirmEmailEN from '@/templates/mails/confirm.en';
// import CancelEmailES from '@/templates/mails/cancel.es';
// import CancelEmailEN from '@/templates/mails/cancel.en';
// import ReminderEmailES from '@/templates/mails/reminder.es';
// import ReminderEmailEN from '@/templates/mails/reminder.en';
// ...importa aquí otros templates según los eventos que manejes

// const sender: EmailSender = new ResendAdapter();

// Mapeo de tipo de evento a función de template
// const templateMap: Record<string, (props: any) => { subject: string; html: string }> = {
//   'reserva.confirmada': ConfirmEmailES, // o ConfirmEmailEN según idioma
//   'reserva.cancelada': CancelEmailES,   // o CancelEmailEN
//   'reserva.reminder': ReminderEmailES,  // o ReminderEmailEN
//   // ...agrega aquí los demás eventos y templates
// };

export async function handler() {
  // const supabase = createAdminClient();
  // const { data: eventos } = await supabase
  //   .from('eventos')
  //   .update({ estado: 'en_proceso' })
  //   .eq('estado', 'pendiente')
  //   .limit(100)
  //   .select('*');

  // for (const ev of eventos ?? []) {
  //   const templateFn = templateMap[ev.tipo];
  //   if (!templateFn) {
  //     // Si no hay template para el evento, lo marcamos como procesado y seguimos
  //     await supabase.from('eventos').update({ estado: 'procesado', procesado_en: 'now()' }).eq('id', ev.id);
  //     continue;
  //   }
  //   // Ahora pasamos el tipo de evento como templateId y el payload como datos
  //   await sender.send([ev.payload.recipient], ev.tipo, ev.payload);
  //   await supabase.from('eventos').update({ estado: 'procesado', procesado_en: 'now()' }).eq('id', ev.id);
  // }
}
