/**
 * Generador de turnos a partir de un horario
 * Este servicio toma horarios recurrentes y genera los turnos concretos (fecha + hora)
 */

import { formatDate } from '../utils/calendar';
import { expandirFechasDesdeHorario } from '../utils/recurrence';
import { logError, logInfo } from '@/utils/error/logger';
import { Horario, ResultadoGeneracion, Turno, TurnoOmitido } from '../types';
import { createClient } from '@/utils/supabase/server';

/**
 * Genera turnos a partir de un horario y los inserta en la base de datos si no existen
 * @param horario Objeto horario con información de recurrencia
 * @returns Resultado de la generación con resumen de totales
 */
export async function generarTurnosDesdeHorario(horario: Horario): Promise<ResultadoGeneracion> {
  try {
    // Obtener el cliente de Supabase
    const supabase = await createClient();

    // Si el horario no está habilitado, devolvemos cero resultados
    if (!horario.habilitada) {
      return { totalFechas: 0, turnosCreados: 0, omitidos: 0, turnosOmitidos: [] };
    }

    // Expandir todas las fechas válidas según la recurrencia del horario
    const fechas: Date[] = expandirFechasDesdeHorario(horario);
    const totalFechas = fechas.length;

    const resultado: ResultadoGeneracion = {
      totalFechas,
      turnosCreados: 0,
      omitidos: 0,
      turnosOmitidos: [],
    };

    if (fechas.length === 0) {
      return resultado;
    }

    // Formatear todas las fechas a string 'YYYY-MM-DD' (o el formato que use la DB)
    const fechasFormateadas: string[] = fechas.map((f) => formatDate(f));

    // 1) Leer en bloque los turnos ya existentes para este horario y esas fechas
    const { data: existentes, error: errorLectura } = await supabase
        .from("turnos")
        .select("fecha")
        .eq("horario_id", horario.id)
        .in("fecha", fechasFormateadas)
        .is("deleted_at", null);

    if (errorLectura) {
      logError(errorLectura, {
        service: "turnoGenerator",
        method: "generarTurnosDesdeHorario",
        horarioId: horario.id,
      });
      throw errorLectura;
    }

    // Crear un Set con las fechas que ya existen en la DB
    const fechasExistentesSet = new Set<string>(
        (existentes ?? []).map((r) => r.fecha)
    );

    // 2) Filtrar sólo las fechas que NO existen aún
    const fechasParaCrear = fechasFormateadas.filter(
        (f) => !fechasExistentesSet.has(f)
    );

    // 3) Armar array de nuevos turnos para insert bulk
    const nuevosTurnos: Partial<Turno>[] = fechasParaCrear.map(
        (fechaFormateada) => ({
          horario_id: horario.id!,
          actividad_id: horario.actividad_id,
          agencia_id: horario.agencia_id!,
          fecha: fechaFormateada,
          hora_inicio: horario.hora_inicio,
          hora_fin: horario.hora_fin,
          cupo_total: horario.cupo,
          cupo_disponible: horario.cupo,
          bloquear: false,
          created_at: new Date().toISOString(),
        })
    );

    // 4) Si hay turnos nuevos para crear, hacemos un solo bulk insert
    if (nuevosTurnos.length > 0) {
      const { data: creado, error: errorBulkInsert } = await supabase
          .from("turnos")
          .insert(nuevosTurnos)
          .select("id, fecha");

      if (errorBulkInsert) {
        logError(errorBulkInsert, {
          service: "turnoGenerator",
          method: "generarTurnosDesdeHorario",
          horarioId: horario.id,
          detalles: "Error al insertar bulk",
        });
        throw errorBulkInsert;
      }

      // El array 'creado' contiene las filas efectivamente insertadas
      resultado.turnosCreados = creado?.length ?? 0;
    }

    // 5) Calcular cuántos se omitieron (ya existían)
    resultado.omitidos = totalFechas - resultado.turnosCreados;

    // 6) Construir lista de turnosOmitidos para cada fecha ya existente
    fechasFormateadas.forEach((fechaFormateada) => {
      if (fechasExistentesSet.has(fechaFormateada)) {
        resultado.turnosOmitidos?.push({
          fecha: fechaFormateada,
          horario_id: horario.id!,
          motivo: "Ya existe un turno para esta fecha y horario",
        });
      }
    });

    logInfo(`Generación completada para horario ${horario.id}`, {
      service: "turnoGenerator",
      method: "generarTurnosDesdeHorario",
      resultado,
    });

    return resultado;


  } catch (error) {
    logError(error, { 
      service: 'turnoGenerator', 
      method: 'generarTurnosDesdeHorario',
      horarioId: horario.id
    });
    throw error;
  }
}

/**
 * Genera turnos para todos los horarios asociados a una actividad
 * @param actividadId ID de la actividad
 * @returns Resultado de la generación con resumen de totales
 */
export async function generarTurnosDesdeActividad(actividadId: number): Promise<ResultadoGeneracion> {
  try {
    // Obtener el cliente de Supabase
    const supabase = await createClient();
    
    const resultado: ResultadoGeneracion = {
      totalFechas: 0,
      turnosCreados: 0,
      omitidos: 0,
      turnosOmitidos: []
    };
    
    // Obtener todos los horarios habilitados de la actividad
    const { data: horarios, error } = await supabase
      .from('horarios')
      .select('*')
      .eq('actividad_id', actividadId)
      .eq('habilitada', true)
      .is('deleted_at', null);
    
    if (error) {
      logError(error, { 
        service: 'turnoGenerator', 
        method: 'generarTurnosDesdeActividad',
        actividadId
      });
      throw error;
    }
    
    if (!horarios || horarios.length === 0) {
      return resultado;
    }
    
    // Generar turnos para cada horario
    for (const horario of horarios) {
      const resultadoHorario = await generarTurnosDesdeHorario(horario);
      
      // Acumular resultados
      resultado.totalFechas += resultadoHorario.totalFechas;
      resultado.turnosCreados += resultadoHorario.turnosCreados;
      resultado.omitidos += resultadoHorario.omitidos;
      
      // Concatenar los turnos omitidos
      if (resultadoHorario.turnosOmitidos && resultadoHorario.turnosOmitidos.length > 0) {
        resultado.turnosOmitidos?.push(...resultadoHorario.turnosOmitidos);
      }
    }
    
    // Guardar en log el resultado
    logInfo(`Turnos generados para actividad ${actividadId}`, {
      service: 'turnoGenerator',
      method: 'generarTurnosDesdeActividad',
      actividadId,
      resultado
    });
    
    return resultado;
    
  } catch (error) {
    logError(error, { 
      service: 'turnoGenerator', 
      method: 'generarTurnosDesdeActividad',
      actividadId
    });
    throw error;
  }
}

/**
 * Regenera los turnos de un horario específico bajo demanda (para mantenimiento)
 * @param horarioId ID del horario a regenerar
 * @returns Resultado de la regeneración con resumen de totales
 */
export async function regenerarTurnosDeHorario(horarioId: number): Promise<ResultadoGeneracion> {
  try {
    // Obtener el cliente de Supabase
    const supabase = await createClient();
    
    // Obtener información del horario
    const { data: horario, error } = await supabase
      .from('horarios')
      .select('*')
      .eq('id', horarioId)
      .eq('habilitada', true)
      .is('deleted_at', null)
      .single();
    
    if (error) {
      logError(error, { 
        service: 'turnoGenerator', 
        method: 'regenerarTurnosDeHorario',
        horarioId
      });
      throw new Error(`Horario no encontrado o no habilitado: ${horarioId}`);
    }
    
    // Generar turnos para este horario
    return await generarTurnosDesdeHorario(horario);
    
  } catch (error) {
    logError(error, { 
      service: 'turnoGenerator', 
      method: 'regenerarTurnosDeHorario',
      horarioId
    });
    throw error;
  }
}
