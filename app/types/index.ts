/**
 * Tipos compartidos para el sistema de generación automática de turnos
 */

/**
 * Tipo de datos para el objeto Horario
 */
export interface Horario {
  id?: number;
  actividad_id: number;
  agencia_id?: number;
  fecha_inicio: string;
  dias: number[]; // 0-6, donde 0 es domingo y 6 es sábado (formato ISO)
  dia_completo: boolean;
  hora_inicio?: string | null;
  hora_fin?: string | null;
  cupo: number;
  habilitada: boolean;
  created_at?: string;
  updated_at?: string | null;
  deleted_at?: string | null;
}

/**
 * Tipo de datos para el objeto Turno
 * Representa una instancia concreta (fecha + hora) generada a partir de un horario
 */
export interface Turno {
  id?: number;
  horario_id: number;
  actividad_id: number;
  agencia_id: number;
  fecha: string; // YYYY-MM-DD
  hora_inicio?: string | null; // HH:MM
  hora_fin?: string | null; // HH:MM
  cupo_total: number;
  cupo_disponible: number;
  bloquear: boolean;
  created_at?: string;
  updated_at?: string | null;
  deleted_at?: string | null;
}

/**
 * Detalles sobre un turno omitido durante la generación
 */
export interface TurnoOmitido {
  fecha: string;
  horario_id: number;
  motivo: string;
}

/**
 * Resultado de la generación de turnos
 */
export interface ResultadoGeneracion {
  totalFechas: number;
  turnosCreados: number;
  omitidos: number;
  turnosOmitidos?: TurnoOmitido[];
}

/**
 * Tipos de modificación temporaria
 */
export enum TipoModificacionTemporaria {
  CAMBIAR_HORA_INICIO = 'CAMBIAR_HORA_INICIO',
  CAMBIAR_CUPOS = 'CAMBIAR_CUPOS',
  BLOQUEAR_HORARIO = 'BLOQUEAR_HORARIO',
  BLOQUEAR_ACTIVIDAD = 'BLOQUEAR_ACTIVIDAD',
  BLOQUEAR_TODAS = 'BLOQUEAR_TODAS'
}

/**
 * Datos para modificación temporaria
 */
export interface ModificacionTemporaria {
  tipo: TipoModificacionTemporaria;
  horario_id?: number;
  actividad_id?: number;
  fecha_desde: string;
  fecha_hasta: string;
  hora_inicio?: string;
  hora_fin?: string;
  cupo_total?: number;
  motivo?: string;
}

/**
 * Resultado de aplicar una modificación temporaria
 */
export interface ResultadoModificacion {
  turnosModificados: number;
  modificados: Turno[];
}
