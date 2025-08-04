import { logError, logInfo } from "@/utils/error/logger";
import { z } from "zod";
import {
  ActividadCompleta,
  ActividadInput,
  actividadSchema,
  actualizacionActividadSchema,
} from "../schemas/actividadSchema";
import {
  getActivityById,
  getActivityByIdIncludingDeleted,
  getAllActivities,
  getAllActivitiesIncludingDeleted,
  softDeleteActividadService,
  updateActividad as updateActividadService,
  verificarActividad,
  updateEstadoActividad,
} from "../services/actividadService";
import { ActualizacionActividad, RespuestaActualizacion } from "../types/types";
import { crearActividadCompletaRPC } from "../services/actividadRpcService";
import { getCronogramaByActividadId } from "../services/cronogramaService";
import { getTarifasByActividadId } from "../services/tarifaService";
import { getAdicionalesByActividadId } from "../services/adicionalService";
import { getTransportesByActividadId } from "../services/transporteService";
import { getDescuentosByActividadId } from "../services/descuentoService";
import { generarTurnosDesdeActividad } from "@/app/services/turnoGenerator";
import {
  RespuestaCreacion,
  ActividadResumen,
  RespuestaConsulta,
} from "../types/types";

export async function createActividadCompleta(
  body: unknown
): Promise<RespuestaCreacion> {
  // Fase 1: Validación - separada para manejar específicamente errores de validación
  let data: ActividadInput;
  try {
    data = actividadSchema.parse(body);
  } catch (error) {
    logError(error, { endpoint: "/api/actividades/POST", fase: "validación" });
    if (error instanceof z.ZodError) {
      return {
        code: 400,
        message: "Datos de entrada inválidos",
        errors: error.flatten().fieldErrors,
        isValidationError: true,
      };
    }
    return {
      code: 500,
      message: "Error inesperado durante la validación de datos",
    };
  }

  // Fase 2: Ejecución - procesa la creación de la actividad y sus componentes
  try {
    const resultado = await crearActividadCompletaRPC(data);

    const actividadCompleta = await getActividadCompleta(resultado.id);

    // Iniciar la generación de turnos en segundo plano sin esperar su finalización
    // Esto permite que la API responda inmediatamente mientras los turnos se generan asíncronamente
    void (async () => {
      try {
        await generarTurnosDesdeActividad(actividadCompleta.id);
        logInfo("Generación de turnos completada en segundo plano", {
          actividadId: actividadCompleta.id,
        });
      } catch (error) {
        logError("Error en la generación de turnos en segundo plano", {
          error,
          actividadId: actividadCompleta.id,
        });
      }
    })();

    logInfo("Actividad creada exitosamente", {
      actividadId: actividadCompleta.id,
    });

    // Los fallbacks solo son necesarios para titulo y estado, los arrays ya están inicializados
    return {
      code: 201,
      message: "Actividad creada exitosamente",
      data: {
        id: actividadCompleta.id,
        titulo: actividadCompleta.titulo || "", // Valor por defecto si es undefined
        estado: actividadCompleta.estado || "borrador", // Valor por defecto si es undefined
        cronograma: actividadCompleta.cronograma,
        tarifas: actividadCompleta.tarifas,
        adicionales: actividadCompleta.adicionales,
        transportes: actividadCompleta.transporte,
        descuentos: actividadCompleta.descuentos,
        detalles: actividadCompleta.detalles, // Agregar los detalles a la respuesta
      },
    };
  } catch (err) {
    logError(err, { endpoint: "/api/actividades/POST", fase: "ejecución" });
    return {
      code: 500,
      message:
        err instanceof Error ? err.message : "Error interno del servidor",
    };
  } finally {
    logInfo("Fin de ejecución de createActividadCompleta", {
      endpoint: "/api/actividades/POST",
    });
  }
}

export async function getActividad(
  actividadId: number | null,
  agenciaId: number | null,
  includeDeleted: boolean = false
): Promise<RespuestaConsulta> {
  try {
    // Si se proporciona un ID, buscar una actividad específica
    if (actividadId !== null) {
      // Obtener datos básicos de la actividad
      const actividadCompleta: ActividadCompleta = includeDeleted
        ? await getActividadCompletaIncludingDeleted(actividadId)
        : await getActividadCompleta(actividadId);

      logInfo(`Actividad obtenida exitosamente: ${actividadId}`, {
        endpoint: "/api/actividades/GET",
      });
      return {
        code: 200,
        message: "Actividad obtenida exitosamente",
        data: actividadCompleta,
      };
    }
    // Si no se proporciona un ID, listar todas las actividades con información básica
    else {
      const resultados = includeDeleted
        ? await getAllActivitiesIncludingDeleted(agenciaId)
        : await getAllActivities(agenciaId);

      logInfo(`Actividades obtenidas exitosamente: ${resultados.length}`, {
        endpoint: "/api/actividades/GET",
      });
      return {
        code: 200,
        message: "Actividades obtenidas exitosamente",
        data: resultados as ActividadResumen[],
      };
    }
  } catch (err) {
    logError(err, { endpoint: "/api/actividades/GET" });
    if (err instanceof Error && err.message === "Actividad no encontrada") {
      return {
        code: 404,
        message: "Actividad no encontrada",
      };
    }
    return {
      code: 500,
      message:
        err instanceof Error
          ? `Error del servidor: ${err.message}`
          : "Error interno del servidor",
    };
  }
}

async function getActividadCompleta(actividadId: number) {
  try {
    // Obtener la actividad básica
    const actividad = await getActivityById(actividadId);

    // Obtener todos los datos relacionados en paralelo
    const [cronograma, tarifas, adicionales, transportes, descuentos] =
      await Promise.all([
        getCronogramaByActividadId(actividadId),
        getTarifasByActividadId(actividadId),
        getAdicionalesByActividadId(actividadId),
        getTransportesByActividadId(actividadId),
        getDescuentosByActividadId(actividadId),
      ]);

    // Combinar todos los datos
    return {
      ...actividad,
      cronograma,
      tarifas,
      adicionales,
      transportes,
      descuentos,
    };
  } catch (error) {
    logError(error, { endpoint: "/api/actividades/GET", actividadId });
    throw error;
  }
}

async function getActividadCompletaIncludingDeleted(actividadId: number) {
  try {
    // Obtener la actividad básica (incluyendo soft deleted)
    const actividad = await getActivityByIdIncludingDeleted(actividadId);

    // Obtener todos los datos relacionados en paralelo
    const [cronograma, tarifas, adicionales, transportes, descuentos] =
      await Promise.all([
        getCronogramaByActividadId(actividadId),
        getTarifasByActividadId(actividadId),
        getAdicionalesByActividadId(actividadId),
        getTransportesByActividadId(actividadId),
        getDescuentosByActividadId(actividadId),
      ]);

    // Combinar todos los datos
    return {
      ...actividad,
      cronograma,
      tarifas,
      adicionales,
      transportes,
      descuentos,
    };
  } catch (error) {
    logError(error, { endpoint: "/api/actividades/GET", actividadId });
    throw error;
  }
}

/**
 * Elimina lógicamente una actividad marcándola como inactiva y estableciendo la fecha de eliminación
 * @param id ID de la actividad a eliminar
 * @returns Objeto con el resultado de la operación
 */
export async function softDeleteActividad(
  id: number
): Promise<{ code: number; message: string }> {
  try {
    const { error } = await softDeleteActividadService(id);

    if (error) {
      logError(error, {
        endpoint: "/api/actividades/DELETE",
        actividadId: id,
        errorDetails: error,
      });

      return {
        code: 500,
        message: "Error al eliminar la actividad",
      };
    }

    logInfo("Actividad eliminada correctamente", {
      endpoint: "/api/actividades/DELETE",
      actividadId: id,
    });

    return {
      code: 200,
      message: "Actividad eliminada correctamente",
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        code: 400,
        message: "Datos de entrada inválidos: " + error.flatten().fieldErrors,
      };
    }
    logError(error, {
      endpoint: "/api/actividades/DELETE",
      actividadId: id,
    });
    return {
      code: 500,
      message: "Error al eliminar la actividad",
    };
  }
}

/**
 * Valida los datos de entrada para la actualización de una actividad
 */
function validarDatosActualizacion(data: unknown): {
  success: boolean;
  data?: ActualizacionActividad;
  error?: any;
} {
  const resultado = actualizacionActividadSchema.safeParse(data);

  if (!resultado.success) {
    return {
      success: false,
      error: resultado.error.flatten(),
    };
  }

  return { success: true, data: resultado.data };
}

/**
 * Actualiza una actividad por su ID.
 * @param id ID de la actividad a actualizar
 * @param body Datos de la actividad a actualizar
 * @returns Objeto con el resultado de la operación
 */
export async function updateActividad(
  id: number,
  body: unknown
): Promise<RespuestaActualizacion> {
  try {
    // 1. Verificar que la actividad existe
    const actividadExiste = await verificarActividad(id);
    if (!actividadExiste) {
      return {
        code: 404,
        message:
          "Actividad no encontrada o no tienes permisos para actualizarla",
      };
    }

    // 2. Validar los datos de entrada
    const validacion = validarDatosActualizacion(body);
    if (!validacion.success) {
      return {
        code: 400,
        message: "Datos de entrada inválidos",
        errors: validacion.error,
        isValidationError: true,
      };
    }

    // 3. Preparar y ejecutar la actualización
    const updateData = validacion.data!;
    const updatedActividad = await updateActividadService(id, updateData);

    // 4. Registrar éxito y retornar respuesta
    logInfo("Actividad actualizada correctamente", {
      endpoint: "/api/actividades/PUT",
      actividadId: id,
      camposActualizados: Object.keys(updateData),
    });

    return {
      code: 200,
      message: "Actividad actualizada correctamente",
      data: updatedActividad,
    };
  } catch (error) {
    // Manejo de errores
    const mensajeError =
      error instanceof Error ? error.message : "Error desconocido";

    logError(error, {
      endpoint: "/api/actividades/PUT",
      actividadId: id,
      error: mensajeError,
    });

    return {
      code: 500,
      message: `Error al actualizar la actividad: ${mensajeError}`,
    };
  }
}

/**
 * Cambia el estado de una actividad entre 'borrador' y 'publicado'
 * @param id ID de la actividad
 * @param nuevoEstado Nuevo estado ('borrador' o 'publicado')
 * @returns Objeto con el resultado de la operación
 */
export async function cambiarEstadoActividad(
  id: number,
  nuevoEstado: "borrador" | "publicado"
): Promise<RespuestaActualizacion> {
  try {
    // Verificar que la actividad existe
    const actividadExiste = await verificarActividad(id);
    if (!actividadExiste) {
      return {
        code: 404,
        message: "Actividad no encontrada",
      };
    }

    // Validar que el estado sea válido
    if (nuevoEstado !== "borrador" && nuevoEstado !== "publicado") {
      return {
        code: 400,
        message:
          "Estado no válido. Los valores permitidos son: borrador, publicado",
        isValidationError: true,
      };
    }

    // Actualizar solo el estado de la actividad
    const resultado = await updateEstadoActividad(id, {
      estado: nuevoEstado,
    } as any);

    return {
      code: 200,
      message: `Estado de la actividad actualizado a '${nuevoEstado}' exitosamente`,
      data: resultado,
    };
  } catch (error) {
    logError(error, {
      endpoint: "/api/actividades/cambiar-estado",
      actividadId: id,
      nuevoEstado,
    });
    return {
      code: 500,
      message: "Error al cambiar el estado de la actividad",
      errors: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
