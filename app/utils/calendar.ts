/**
 * Utilidades para manipulación de fechas y calendarios
 * Proporciona funciones para trabajar con rangos de fechas, formatos, etc.
 */

/**
 * Convierte una fecha en string (YYYY-MM-DD) a objeto Date
 * @param fechaStr Fecha en formato YYYY-MM-DD
 * @returns Objeto Date con la fecha indicada a las 00:00:00
 */
export function stringToDate(fechaStr: string): Date {
  const fecha = new Date(fechaStr);
  fecha.setUTCHours(0, 0, 0, 0);
  return fecha;
}

/**
 * Formatea una fecha como string en formato YYYY-MM-DD
 * @param fecha Objeto Date a formatear
 * @returns String en formato YYYY-MM-DD
 */
export function formatDate(fecha: Date): string {
  return fecha.toISOString().split('T')[0];
}

/**
 * Comprueba si una fecha está entre un rango (inclusivo)
 * @param fecha Fecha a comprobar
 * @param inicio Fecha de inicio del rango
 * @param fin Fecha de fin del rango
 * @returns true si la fecha está dentro del rango
 */
export function fechaEnRango(fecha: Date, inicio: Date, fin: Date): boolean {
  return fecha >= inicio && fecha <= fin;
}

/**
 * Obtiene todas las fechas entre dos fechas (inclusivas)
 * @param fechaInicio Fecha de inicio
 * @param fechaFin Fecha de fin
 * @returns Array de objetos Date con todas las fechas en el rango
 */
export function obtenerFechasEnRango(fechaInicio: Date, fechaFin: Date): Date[] {
  const fechas: Date[] = [];
  const fechaActual = new Date(fechaInicio);
  
  while (fechaActual <= fechaFin) {
    fechas.push(new Date(fechaActual));
    fechaActual.setUTCDate(fechaActual.getUTCDate() + 1);
  }
  
  return fechas;
}

/**
 * Comprueba si dos rangos de fechas se solapan
 * @param inicio1 Inicio del primer rango
 * @param fin1 Fin del primer rango
 * @param inicio2 Inicio del segundo rango
 * @param fin2 Fin del segundo rango
 * @returns true si hay solapamiento
 */
export function rangosSeSuperponen(inicio1: Date, fin1: Date, inicio2: Date, fin2: Date): boolean {
  return inicio1 <= fin2 && inicio2 <= fin1;
}

/**
 * Suma un número de días a una fecha
 * @param fecha Fecha original
 * @param dias Número de días a sumar (puede ser negativo)
 * @returns Nueva fecha
 */
export function sumarDias(fecha: Date, dias: number): Date {
  const nuevaFecha = new Date(fecha);
  nuevaFecha.setUTCDate(nuevaFecha.getUTCDate() + dias);
  return nuevaFecha;
}

/**
 * Calcula la diferencia en días entre dos fechas
 * @param fecha1 Primera fecha
 * @param fecha2 Segunda fecha
 * @returns Número de días entre las fechas (valor absoluto)
 */
export function diferenciaEnDias(fecha1: Date, fecha2: Date): number {
  const diffTime = Math.abs(fecha2.getTime() - fecha1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Obtiene la fecha actual en UTC con horas, minutos, segundos y milisegundos a 0
 * @returns Fecha actual (solo día)
 */
export function fechaActual(): Date {
  const hoy = new Date();
  hoy.setUTCHours(0, 0, 0, 0);
  return hoy;
}
