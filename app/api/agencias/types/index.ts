/**
 * Interfaces y tipos compartidos para el módulo de agencias
 */

/**
 * Filtros para consulta de agencias
 */
export interface FiltrosAgencia {
  id?: number;
  activa?: boolean;
}

/**
 * Datos para crear o actualizar una agencia
 */
export interface AgenciaData {
  nombre: string;
  email_contacto: string;
  telefono?: string;
  direccion?: string;
  termino_cond?: string;
  moneda?: string;
  activa?: boolean;
  cedula?: number;
  web?: string;
  pais?: string;
  nombre_comercial?: string;
  fee?: string;
  tax?: number | null;
  convenience_fee_fijo?: boolean;
  convenience_fee_fijo_valor?: number | null;
  convenience_fee_variable?: boolean;
  convenience_fee_variable_valor?: number | null;
  nombre_representante?: string; // Nuevo campo
  nombre_departamento_reservas?: string;
  email_departamento_reservas?: string;
  telefono_departamento_reservas?: string;
}
