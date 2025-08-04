import { createClient } from '@/utils/supabase/server';
// import { sendReminderEmail } from '../../lib/email'; // Ajusta según tu lógica de envío
// import reminderTemplate from '../../components/reminder.es'; // Ajusta si usas plantilla

const HORAS = 60 * 60 * 1000;
const WINDOW_MS = 1 * HORAS; // ±1 h

const intervalos = [
  { key: 'recordatorio_24h', horas: 24, texto: '24 horas' },
  { key: 'recordatorio_48h', horas: 48, texto: '48 horas' },
  { key: 'recordatorio_7d', horas: 24 * 7, texto: '7 días' }
];

async function jobRecordatorios() {
  for (const { key, horas, texto } of intervalos) {
    const target = new Date(Date.now() + horas * HORAS);
    const from = new Date(target.getTime() - WINDOW_MS);
    const to = new Date(target.getTime() + WINDOW_MS);

    const supabase = await createClient();

    // Consulta reservas confirmadas con turnos en la ventana y sin notificación previa
    const { data: reservas, error } = await supabase.rpc('buscar_reservas_para_recordatorio', {
      desde: from.toISOString(),
      hasta: to.toISOString(),
      tipo_aviso: key
    });
    if (error) {
      console.error('Error buscando reservas:', error);
      continue;
    }
    for (const reserva of reservas) {
      try {
        // await sendReminderEmail({ ...reserva, tiempo: texto });
        // await supabase.from('notificaciones_enviadas').insert({
        //   entidad_tipo: 'reserva', entidad_id: reserva.id, tipo_aviso: key
        // });
        // console.log(`Enviado recordatorio ${key} a reserva ${reserva.id}`);
      } catch (err) {
        console.error('Error enviando recordatorio:', err);
      }
    }
  }
}

// Programa el job cada 2 horas
//cron.schedule('0 */2 * * *', jobRecordatorios);

export default jobRecordatorios;
