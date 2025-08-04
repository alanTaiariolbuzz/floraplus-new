export interface ClienteInput {
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  activo?: string;
}

export interface ReservaItemInput {
  item_type: "tarifa" | "adicional" | "transporte";
  item_id: number;
  cantidad: number;
}

export interface ReservaHoldInput {
  turno_id: number; // obligatorio
  items: ReservaItemInput[]; // ≥1
  cliente?: ClienteInput; // opcional
}

export type RespuestaHold = {
  code: number;
  message: string;
  data?: {
    reservaId: number;
    clientSecret: string;
    expiresAt: string; // ISO-8601
    cliente?: {
      id?: string;
      isExisting?: boolean;
      reservaActualizada?: boolean;
    } | null;
  };
  errors?: any;
  isValidationError?: boolean;
};

export interface HoldSQLResult {
  reserva_id: number;
  actividad_id: number;
  agencia_id: number;
  monto_total: number;
  expires_at: string;
}

export interface FiltrosReserva {
  id?: number;
  actividad_id?: number;
  turno_id?: number;
  agencia_id?: number;
  created_at?: string;
  cancelled_at?: string;
}

export interface RespuestaReservas {
  code: number;
  message: string;
  data?: any[] | any; // Puede ser array o objeto individual
  error?: string;
}
