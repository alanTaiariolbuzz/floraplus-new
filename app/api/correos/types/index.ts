/**
 * Datos para crear o actualizar configuración de correos
 */
export interface CorreoData {
  agencia_id: number;
  email_from: string;
  email_reply_to: string;
  logo_url?: string;
  logo_filename?: string;
}

/**
 * Datos completos de correos incluyendo campos de auditoría
 */
export interface Correo {
  id: number;
  agencia_id: number;
  email_from: string;
  email_reply_to: string;
  logo_url?: string;
  logo_filename?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Filtros para consultar correos
 */
export interface FiltrosCorreo {
  agencia_id?: number;
}
