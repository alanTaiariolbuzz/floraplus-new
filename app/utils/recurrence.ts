/**
 * Utilidades para convertir días de la semana en fechas concretas
 * Maneja la lógica de recurrencia para la generación de turnos
 */

// Constantes para la configuración de recurrencia
const DIAS_VENTANA_EXPANSION = process.env.NEXT_DIAS_VENTANA_EXPANSION ? parseInt(process.env.NEXT_DIAS_VENTANA_EXPANSION, 10) : 365;

import { Horario } from '../types';


/**
 * Nombres de los días de la semana en formato ISO
 * 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
 */
export const DIAS_SEMANA = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado'
];

/**
 * Expande un horario recurrente en fechas concretas durante un año
 * @param horario Objeto horario con fecha_inicio y días de la semana
 * @returns Array de objetos Date con todas las fechas válidas
 */
export function expandirFechasDesdeHorario(horario: Horario): Date[] {
  // Validar que el horario esté habilitado
  if (!horario.habilitada) {
    return [];
  }

  // Convertir fecha_inicio a Date
  const fechaInicio = new Date(horario.fecha_inicio);
  
  // Asegurarse que la fecha está en UTC para evitar problemas con zonas horarias
  fechaInicio.setUTCHours(0, 0, 0, 0);
  
  // Calcular fecha fin (DIAS_VENTANA_EXPANSION días después de fecha inicio)
  const fechaFin = new Date(fechaInicio);
  fechaFin.setUTCDate(fechaFin.getUTCDate() + DIAS_VENTANA_EXPANSION);
  
  // Array para almacenar todas las fechas generadas
  const fechasGeneradas: Date[] = [];
  
  // Usar directamente los días en formato ISO
  const diasISO = horario.dias;
  
  // Iterar desde fecha inicio hasta fecha fin

  const fechaActual = new Date(fechaInicio);
  while (fechaActual < fechaFin) {
    // Verificar si el día de la semana actual está en el array de días
    const diaSemanaActual = fechaActual.getUTCDay(); // 0-6 (domingo-sábado)
    
    if (diasISO.includes(diaSemanaActual)) {
      // Si el día actual está incluido en los días del horario, añadirlo al resultado
      fechasGeneradas.push(new Date(fechaActual));
    }
    
    // Avanzar al siguiente día
    fechaActual.setUTCDate(fechaActual.getUTCDate() + 1);
  }
  
  return fechasGeneradas;
}

/**
 * Formatea una fecha a formato YYYY-MM-DD
 * @param fecha Objeto Date a formatear
 * @returns Cadena en formato YYYY-MM-DD
 */
export function formatearFecha(fecha: Date): string {
  return fecha.toISOString().split('T')[0];
}
