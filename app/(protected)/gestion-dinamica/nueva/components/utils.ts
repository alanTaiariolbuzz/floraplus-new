import { HorarioAPI, HorarioAgrupado, diasSemana } from "./types";

export const agruparHorariosPorDia = (
  horarios: HorarioAPI[]
): HorarioAgrupado[] => {
  if (!Array.isArray(horarios)) {
    console.error("horarios no es un array:", horarios);
    return [];
  }

  const horariosPorDia = new Map<string, { id: number; hora: string }[]>();

  horarios.forEach((horario) => {
    horario.dias.forEach((dia) => {
      const nombreDia = diasSemana[dia];
      if (!horariosPorDia.has(nombreDia)) {
        horariosPorDia.set(nombreDia, []);
      }
      horariosPorDia.get(nombreDia)?.push({
        id: horario.id,
        hora: horario.hora_inicio.slice(0, 5), // Convertir "19:00:00" a "19:00"
      });
    });
  });

  // Convertir el Map a un array y ordenar por día de la semana
  return Array.from(horariosPorDia.entries())
    .map(([dia, horarios]) => ({
      dia,
      horarios: horarios.sort((a, b) => a.hora.localeCompare(b.hora)),
    }))
    .sort((a, b) => {
      const diaA = a.dia as (typeof diasSemana)[number];
      const diaB = b.dia as (typeof diasSemana)[number];
      return diasSemana.indexOf(diaA) - diasSemana.indexOf(diaB);
    });
};

/**
 * Convierte una fecha a formato YYYY-MM-DD respetando la zona horaria local
 * Evita el problema de desfasaje de un día que ocurre con toISOString()
 */
export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
