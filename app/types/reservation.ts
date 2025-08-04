export interface Actividad {
  id: string;
  titulo: string;
  descripcion: string;
}

export interface Turno {
  turno_id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  cupo_disponible: number;
  cupo_total: number;
  bloqueado: boolean;
}

export interface Tarifa {
  id: number;
  nombre: string;
  nombre_en: string;
  precio: number;
  cupo_disponible: number;
  cupo_total: number;
  actividad_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Adicional {
  id: number;
  nombre: string;
  precio: number;
  descripcion?: string;
}

export interface Transporte {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  horario?: string;
  capacidad: number;
}

export interface PersonalData {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  terminos: boolean;
}

export interface PaymentData {
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
}

export interface Reserva {
  id: number;
  turno_id: number;
  personal_data: PersonalData;
  tarifas: Record<string, number>;
  payment_data: PaymentData;
  total: number;
  numero_reserva: string;
  estado: "pending" | "confirmed" | "cancelled";
  fecha_creacion: string;
}

export interface ReservaData {
  turno_id: number;
  items: Array<{
    item_type: "tarifa" | "adicional" | "transporte";
    item_id: number;
    cantidad: number;
  }>;
}
