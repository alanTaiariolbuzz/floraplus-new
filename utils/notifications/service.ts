import { createClient } from '../supabase/server';
import { logError, logInfo } from '../error/logger';

// Tipos para el servicio de notificaciones
type NotificationType = 
  | 'agencia_problema_banco'
  | 'finance_team'
  | 'system_alert'
  | 'general';

interface NotificationData {
  [key: string]: any;
}

/**
 * Envía una notificación al equipo interno basada en el tipo
 * @param type Tipo de notificación
 * @param data Datos adicionales para la notificación
 * @returns true si la notificación se envió correctamente
 */
export async function notifyTeam(
  type: NotificationType,
  data: NotificationData
): Promise<boolean> {
  try {
    const supabase = await createClient();
    const timestamp = new Date().toISOString();

    // Determinar la severidad según el tipo de notificación
    let severity = 'info';
    if (type === 'agencia_problema_banco' || type === 'finance_team') {
      severity = 'high';
    }

    // Insertar la notificación en la base de datos
    const { error } = await supabase.from('team_notifications').insert({
      type,
      data,
      severity,
      read: false,
      created_at: timestamp
    });

    if (error) throw error;

    logInfo('Notificación al equipo enviada', { type, severity });

    // Si es una notificación de alta prioridad, también enviar a un webhook
    if (severity === 'high' && process.env.TEAM_ALERT_WEBHOOK) {
      await fetch(process.env.TEAM_ALERT_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          data,
          severity,
          timestamp
        })
      });
    }

    return true;
  } catch (error) {
    logError(error, {
      context: 'notification-service',
      type,
      data
    });
    return false;
  }
}
