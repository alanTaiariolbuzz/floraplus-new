export interface Actividad {
  id: number;
  titulo: string;
  imagen: string | null;
}

export interface HorarioAPI {
  id: number;
  dias: number[];
  hora_inicio: string;
}

export interface HorarioAgrupado {
  dia: string;
  horarios: { id: number; hora: string }[];
}

export interface DateRangeState {
  startDate: Date | null;
  endDate: Date | null;
}

export const diasSemana = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
] as const;

export const diasSemanaAbreviados = [
  "Dom",
  "Lun",
  "Mar",
  "Mie",
  "Jue",
  "Vie",
  "Sab",
] as const;

export type ModificacionType =
  | "CAMBIAR_HORA_INICIO"
  | "CAMBIAR_CUPOS"
  | "BLOQUEAR_HORARIO"
  | "BLOQUEAR_ACTIVIDAD"
  | "BLOQUEAR_TODAS";
