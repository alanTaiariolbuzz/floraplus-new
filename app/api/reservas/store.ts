// Array en memoria para simular el almacenamiento de reservas
export const reservas: Array<{
  reserva_id: number;
  numero_reserva: string;
  actividad_id: string;
  turno_id: number;
  tarifas: { [key: number]: number };
  adicionales: { [key: number]: number };
  transportes: { [key: number]: number };
  estado: string;
  fecha_creacion: string;
}> = [];
