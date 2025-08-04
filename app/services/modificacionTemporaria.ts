/**
 * Servicio para aplicar modificaciones temporarias a turnos
 * Permite realizar cambios que afectan a turnos existentes sin modificar los horarios base
 */

import { formatDate, stringToDate } from "../utils/calendar";
import { logError, logInfo } from "../../utils/error/logger";
import {
  ModificacionTemporaria,
  ResultadoModificacion,
  TipoModificacionTemporaria,
  Turno,
} from "../types";
import { createClient } from "../../utils/supabase/server";

// Obtener el cliente de Supabase centralizado
export const getSupabase = async () => await createClient();

/**
 * Aplica una modificación temporaria a los turnos que cumplen con los criterios especificados
 * @param modificacion Datos de la modificación a aplicar
 * @returns Resultado con información sobre los turnos modificados
 */
export async function aplicarModificacionTemporaria(
  modificacion: ModificacionTemporaria
): Promise<ResultadoModificacion> {
  try {
    // Obtener el cliente de Supabase una sola vez al inicio
    const supabase = await getSupabase();

    let query = supabase
      .from("turnos")
      .select("*")
      .gte("fecha", modificacion.fecha_desde)
      .lte("fecha", modificacion.fecha_hasta)
      .is("deleted_at", null);

    // Aplicar filtros según el tipo de modificación
    switch (modificacion.tipo) {
      case TipoModificacionTemporaria.BLOQUEAR_HORARIO:
        if (!modificacion.horario_id) {
          throw new Error("Se requiere horario_id para bloquear por horario");
        }
        query = query.eq("horario_id", modificacion.horario_id);
        break;

      case TipoModificacionTemporaria.BLOQUEAR_ACTIVIDAD:
        if (!modificacion.actividad_id) {
          throw new Error(
            "Se requiere actividad_id para bloquear por actividad"
          );
        }
        query = query.eq("actividad_id", modificacion.actividad_id);
        break;

      case TipoModificacionTemporaria.CAMBIAR_HORA_INICIO:
      case TipoModificacionTemporaria.CAMBIAR_CUPOS:
        if (!modificacion.horario_id) {
          throw new Error("Se requiere horario_id para modificar hora o cupos");
        }
        query = query.eq("horario_id", modificacion.horario_id);
        break;

      // BLOQUEAR_TODAS no requiere filtros adicionales, afecta a todos los turnos en el rango de fechas
    }

    // Obtener los turnos a modificar
    const { data: turnos, error } = await query;

    if (error) {
      logError(error, {
        service: "modificacionTemporaria",
        method: "aplicarModificacionTemporaria",
        modificacion,
      });
      throw error;
    }

    if (!turnos || turnos.length === 0) {
      return { turnosModificados: 0, modificados: [] };
    }

    // Modificaciones a aplicar según el tipo
    const turnosModificados: Turno[] = [];

    for (const turno of turnos) {
      let datos: Partial<Turno> = {
        updated_at: new Date().toISOString(),
      };

      switch (modificacion.tipo) {
        case TipoModificacionTemporaria.BLOQUEAR_HORARIO:
        case TipoModificacionTemporaria.BLOQUEAR_ACTIVIDAD:
        case TipoModificacionTemporaria.BLOQUEAR_TODAS:
          datos.bloquear = true;
          break;

        case TipoModificacionTemporaria.CAMBIAR_HORA_INICIO:
          if (!modificacion.hora_inicio) {
            throw new Error("Se requiere hora_inicio para modificar horario");
          }
          datos.hora_inicio = modificacion.hora_inicio;

          if (modificacion.hora_fin) {
            datos.hora_fin = modificacion.hora_fin;
          }
          break;

        case TipoModificacionTemporaria.CAMBIAR_CUPOS:
          if (modificacion.cupo_total === undefined) {
            throw new Error("Se requiere cupo_total para modificar cupos");
          }

          // Log detallado del estado actual del turno
          logInfo(`Aplicando cambio de cupos al turno ${turno.id}`, {
            service: "modificacionTemporaria",
            method: "aplicarModificacionTemporaria",
            turnoId: turno.id,
            cupoTotalActual: turno.cupo_total,
            cupoDisponibleActual: turno.cupo_disponible,
            cupoTotalNuevo: modificacion.cupo_total,
            fecha: turno.fecha,
            hora_inicio: turno.hora_inicio,
          });

          // Si el nuevo cupo es menor que el actual, verificar reservas
          if (modificacion.cupo_total < turno.cupo_total) {
            // Calcular reservas actuales
            const reservasActuales = turno.cupo_total - turno.cupo_disponible;

            // Verificar que no se intente reducir por debajo de las reservas existentes
            if (modificacion.cupo_total < reservasActuales) {
              logInfo(
                `No se puede reducir cupo por debajo de reservas (${reservasActuales}) para turno ${turno.id}`,
                {
                  service: "modificacionTemporaria",
                  method: "aplicarModificacionTemporaria",
                  turnoId: turno.id,
                  cupoActual: turno.cupo_total,
                  cupoNuevo: modificacion.cupo_total,
                  reservas: reservasActuales,
                }
              );
              continue; // Saltar este turno
            }

            // Actualizar cupo disponible considerando las reservas
            datos.cupo_disponible = modificacion.cupo_total - reservasActuales;
          } else {
            // Si aumenta el cupo, recalcular cupo disponible basándose en las reservas existentes
            const reservasActuales = turno.cupo_total - turno.cupo_disponible;
            datos.cupo_disponible = Math.max(
              0,
              modificacion.cupo_total - reservasActuales
            );
          }

          datos.cupo_total = modificacion.cupo_total;

          // Log del resultado del cálculo
          logInfo(`Cálculo completado para turno ${turno.id}`, {
            service: "modificacionTemporaria",
            method: "aplicarModificacionTemporaria",
            turnoId: turno.id,
            cupoTotalAnterior: turno.cupo_total,
            cupoDisponibleAnterior: turno.cupo_disponible,
            cupoTotalNuevo: datos.cupo_total,
            cupoDisponibleNuevo: datos.cupo_disponible,
            reservasActuales: turno.cupo_total - turno.cupo_disponible,
          });

          break;
      }

      // Log de los datos que se van a actualizar
      logInfo(`Actualizando turno ${turno.id} en la base de datos`, {
        service: "modificacionTemporaria",
        method: "aplicarModificacionTemporaria",
        turnoId: turno.id,
        datosAActualizar: datos,
        tipoModificacion: modificacion.tipo,
      });

      // Actualizar el turno en la base de datos
      const { data: turnoActualizado, error: errorActualizacion } =
        await supabase
          .from("turnos")
          .update(datos)
          .eq("id", turno.id)
          .select()
          .single();

      if (errorActualizacion) {
        logError(errorActualizacion, {
          service: "modificacionTemporaria",
          method: "aplicarModificacionTemporaria",
          turnoId: turno.id,
          datos,
        });
        continue; // Continuar con el siguiente turno
      }

      // Log del resultado de la actualización
      logInfo(`Turno ${turno.id} actualizado exitosamente`, {
        service: "modificacionTemporaria",
        method: "aplicarModificacionTemporaria",
        turnoId: turno.id,
        turnoActualizado: turnoActualizado,
        cupoTotalAnterior: turno.cupo_total,
        cupoTotalNuevo: turnoActualizado.cupo_total,
        cupoDisponibleAnterior: turno.cupo_disponible,
        cupoDisponibleNuevo: turnoActualizado.cupo_disponible,
      });

      turnosModificados.push(turnoActualizado);
    }

    logInfo(`Modificación temporaria aplicada: ${modificacion.tipo}`, {
      service: "modificacionTemporaria",
      method: "aplicarModificacionTemporaria",
      tipo: modificacion.tipo,
      fechaDesde: modificacion.fecha_desde,
      fechaHasta: modificacion.fecha_hasta,
      turnosModificados: turnosModificados.length,
    });

    return {
      turnosModificados: turnosModificados.length,
      modificados: turnosModificados,
    };
  } catch (error) {
    logError(error, {
      service: "modificacionTemporaria",
      method: "aplicarModificacionTemporaria",
      modificacion,
    });
    throw error;
  }
}

/**
 * Revierte una modificación temporaria aplicando los valores originales a los turnos
 * @param modificacionId ID de la modificación temporal a revertir
 * @returns Resultado con información sobre los turnos revertidos
 */
export async function revertirModificacionTemporaria(
  modificacionId: number
): Promise<ResultadoModificacion> {
  try {
    const supabase = await getSupabase();

    // 1. Obtener la modificación temporal
    const { data: modificacion, error: errorModificacion } = await supabase
      .from("modificaciones_temporarias")
      .select("*")
      .eq("id", modificacionId)
      .single();

    if (errorModificacion || !modificacion) {
      throw new Error("Modificación temporal no encontrada");
    }

    logInfo(`Revirtiendo modificación temporal ${modificacionId}`, {
      service: "modificacionTemporaria",
      method: "revertirModificacionTemporaria",
      tipo: modificacion.tipo_modificacion,
      fechaDesde: modificacion.fecha_desde,
      fechaHasta: modificacion.fecha_hasta,
    });

    // 2. Construir query para obtener turnos afectados
    let query = supabase
      .from("turnos")
      .select("*")
      .gte("fecha", modificacion.fecha_desde)
      .lte("fecha", modificacion.fecha_hasta)
      .is("deleted_at", null);

    // Aplicar filtros según el tipo de modificación
    switch (modificacion.tipo_modificacion) {
      case "BLOQUEAR_HORARIO":
        if (!modificacion.horario_id) {
          throw new Error(
            "Se requiere horario_id para revertir bloqueo de horario"
          );
        }
        query = query.eq("horario_id", modificacion.horario_id);
        break;

      case "BLOQUEAR_ACTIVIDAD":
        if (!modificacion.actividad_id) {
          throw new Error(
            "Se requiere actividad_id para revertir bloqueo de actividad"
          );
        }
        query = query.eq("actividad_id", modificacion.actividad_id);
        break;

      case "CAMBIAR_HORA_INICIO":
      case "CAMBIAR_CUPOS":
        if (!modificacion.horario_id) {
          throw new Error("Se requiere horario_id para revertir modificación");
        }
        query = query.eq("horario_id", modificacion.horario_id);
        break;

      // BLOQUEAR_TODAS no requiere filtros adicionales
    }

    // 3. Obtener los turnos a revertir
    const { data: turnos, error: errorTurnos } = await query;

    if (errorTurnos) {
      logError(errorTurnos, {
        service: "modificacionTemporaria",
        method: "revertirModificacionTemporaria",
        modificacionId,
      });
      throw errorTurnos;
    }

    if (!turnos || turnos.length === 0) {
      return { turnosModificados: 0, modificados: [] };
    }

    // 4. Revertir los turnos según el tipo de modificación
    const turnosRevertidos: Turno[] = [];

    for (const turno of turnos) {
      let datos: Partial<Turno> = {
        updated_at: new Date().toISOString(),
      };

      switch (modificacion.tipo_modificacion) {
        case "BLOQUEAR_HORARIO":
        case "BLOQUEAR_ACTIVIDAD":
        case "BLOQUEAR_TODAS":
          // Revertir bloqueo
          datos.bloquear = false;
          break;

        case "CAMBIAR_HORA_INICIO":
          // Revertir a la hora original
          if (modificacion.hora_inicio_actual) {
            datos.hora_inicio = modificacion.hora_inicio_actual;
          }
          break;

        case "CAMBIAR_CUPOS":
          // Revertir a los cupos originales
          if (modificacion.cupo_actual !== null) {
            datos.cupo_total = modificacion.cupo_actual;

            // Recalcular cupo disponible basándose en las reservas existentes
            const reservasActuales = turno.cupo_total - turno.cupo_disponible;
            datos.cupo_disponible = Math.max(
              0,
              modificacion.cupo_actual - reservasActuales
            );
          }
          break;
      }

      // Actualizar el turno en la base de datos
      const { data: turnoRevertido, error: errorActualizacion } = await supabase
        .from("turnos")
        .update(datos)
        .eq("id", turno.id)
        .select()
        .single();

      if (errorActualizacion) {
        logError(errorActualizacion, {
          service: "modificacionTemporaria",
          method: "revertirModificacionTemporaria",
          turnoId: turno.id,
          datos,
        });
        continue; // Continuar con el siguiente turno
      }

      logInfo(`Turno ${turno.id} revertido exitosamente`, {
        service: "modificacionTemporaria",
        method: "revertirModificacionTemporaria",
        turnoId: turno.id,
        tipoModificacion: modificacion.tipo_modificacion,
        datosRevertidos: datos,
      });

      turnosRevertidos.push(turnoRevertido);
    }

    logInfo(
      `Modificación temporal revertida: ${modificacion.tipo_modificacion}`,
      {
        service: "modificacionTemporaria",
        method: "revertirModificacionTemporaria",
        modificacionId,
        tipo: modificacion.tipo_modificacion,
        fechaDesde: modificacion.fecha_desde,
        fechaHasta: modificacion.fecha_hasta,
        turnosRevertidos: turnosRevertidos.length,
      }
    );

    return {
      turnosModificados: turnosRevertidos.length,
      modificados: turnosRevertidos,
    };
  } catch (error) {
    logError(error, {
      service: "modificacionTemporaria",
      method: "revertirModificacionTemporaria",
      modificacionId,
    });
    throw error;
  }
}

/**
 * Desbloquea turnos previamente bloqueados en un rango de fechas
 * @param criterios Criterios para desbloquear turnos (horario_id, actividad_id, fechas)
 * @returns Resultado con información sobre los turnos desbloqueados
 */
export async function desbloquearTurnos(criterios: {
  horario_id?: number;
  actividad_id?: number;
  fecha_desde: string;
  fecha_hasta: string;
}): Promise<ResultadoModificacion> {
  try {
    // Obtener el cliente de Supabase una sola vez al inicio
    const supabase = await getSupabase();

    let query = supabase
      .from("turnos")
      .select("*")
      .eq("bloqueado", true)
      .gte("fecha", criterios.fecha_desde)
      .lte("fecha", criterios.fecha_hasta)
      .is("deleted_at", null);

    // Aplicar filtros adicionales si se proporcionan
    if (criterios.horario_id) {
      query = query.eq("horario_id", criterios.horario_id);
    }

    if (criterios.actividad_id) {
      query = query.eq("actividad_id", criterios.actividad_id);
    }

    // Obtener los turnos a desbloquear
    const { data: turnos, error } = await query;

    if (error) {
      logError(error, {
        service: "modificacionTemporaria",
        method: "desbloquearTurnos",
        criterios,
      });
      throw error;
    }

    if (!turnos || turnos.length === 0) {
      return { turnosModificados: 0, modificados: [] };
    }

    // Desbloquear los turnos
    const turnosModificados: Turno[] = [];

    for (const turno of turnos) {
      const { data: turnoActualizado, error: errorActualizacion } =
        await supabase
          .from("turnos")
          .update({
            bloqueado: false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", turno.id)
          .select()
          .single();

      if (errorActualizacion) {
        logError(errorActualizacion, {
          service: "modificacionTemporaria",
          method: "desbloquearTurnos",
          turnoId: turno.id,
        });
        continue;
      }

      turnosModificados.push(turnoActualizado);
    }

    logInfo(`Desbloqueo de turnos completado`, {
      service: "modificacionTemporaria",
      method: "desbloquearTurnos",
      fechaDesde: criterios.fecha_desde,
      fechaHasta: criterios.fecha_hasta,
      turnosDesbloqueados: turnosModificados.length,
    });

    return {
      turnosModificados: turnosModificados.length,
      modificados: turnosModificados,
    };
  } catch (error) {
    logError(error, {
      service: "modificacionTemporaria",
      method: "desbloquearTurnos",
      criterios,
    });
    throw error;
  }
}
