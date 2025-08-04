import { ZodError } from "zod";
import { logError, logInfo } from "../../../../../utils/error/logger";
import {
  modificacionTemporariaSchema,
  baseModificacionTemporariaSchema,
} from "../schemas/modificacionTemporariaSchema";
import {
  guardarModificacion,
  getModificacionesTemporarias,
  updateModificacionTemporaria,
  deleteModificacionTemporaria,
} from "../services/modificacionTemporariaService";
import { aplicarModificacionTemporaria } from "../../../../services/modificacionTemporaria";
import { TipoModificacionTemporaria } from "../../../../types";

/**
 * Guarda una nueva modificación temporaria
 */
export async function guardarModificacionTemporaria(body: any) {
  try {
    // Validate data
    const data = modificacionTemporariaSchema.parse(body);

    // Save modification
    const resultado = await guardarModificacion(data);

    // Aplicar la modificación a los turnos automáticamente
    if (resultado.data && resultado.data[0]) {
      const modificacionGuardada = resultado.data[0];

      // Convertir el formato de la modificación guardada al formato esperado por aplicarModificacionTemporaria
      const modificacionParaAplicar = {
        tipo: modificacionGuardada.tipo_modificacion as TipoModificacionTemporaria,
        horario_id: modificacionGuardada.horario_id || undefined,
        actividad_id: modificacionGuardada.actividad_id || undefined,
        fecha_desde: modificacionGuardada.fecha_desde,
        fecha_hasta: modificacionGuardada.fecha_hasta,
        hora_inicio: modificacionGuardada.hora_inicio_nueva || undefined,
        hora_fin: undefined, // No se usa en el esquema actual
        cupo_total: modificacionGuardada.nuevos_cupos_totales || undefined,
        motivo: undefined,
      };

      try {
        const resultadoAplicacion = await aplicarModificacionTemporaria(
          modificacionParaAplicar
        );

        logInfo("Modificación temporaria aplicada automáticamente", {
          controller: "modificacionTemporariaController",
          method: "guardarModificacionTemporaria",
          modificacionId: modificacionGuardada.id,
          turnosModificados: resultadoAplicacion.turnosModificados,
        });

        return {
          code: 201,
          message: `Modificación temporaria guardada y aplicada exitosamente. ${resultadoAplicacion.turnosModificados} turnos modificados.`,
          data: resultado,
          aplicacion: resultadoAplicacion,
        };
      } catch (errorAplicacion) {
        logError(errorAplicacion, {
          controller: "modificacionTemporariaController",
          method: "guardarModificacionTemporaria",
          errorType: "aplicacionError",
          modificacionId: modificacionGuardada.id,
        });

        // La modificación se guardó pero no se pudo aplicar
        return {
          code: 201,
          message:
            "Modificación temporaria guardada pero no se pudo aplicar automáticamente",
          data: resultado,
          warning:
            "La modificación se guardó pero no se aplicó a los turnos. Contacte al administrador.",
        };
      }
    }

    return {
      code: 201,
      message: "Modificación temporaria guardada exitosamente",
      data: resultado,
    };
  } catch (err: any) {
    // Handle custom errors from the service
    if (err.statusCode) {
      logError(err, {
        controller: "modificacionTemporariaController",
        method: "guardarModificacionTemporaria",
        errorType: err.statusCode >= 500 ? "serverError" : "businessLogicError",
        details: err.details,
      });

      return {
        code: err.statusCode,
        message: err.message,
        ...(err.details && { details: err.details }),
      };
    }

    // Handle validation errors
    if (err instanceof ZodError) {
      logError(err, {
        controller: "modificacionTemporariaController",
        method: "guardarModificacionTemporaria",
        errorType: "validationError",
      });
      return {
        code: 400,
        message: "Datos de modificación temporaria inválidos",
        errors: err.errors,
      };
    }

    // Handle unexpected errors
    logError(err, {
      controller: "modificacionTemporariaController",
      method: "guardarModificacionTemporaria",
    });
    return {
      code: 500,
      message: "Error interno al guardar la modificación temporaria",
    };
  }
}

/**
 * Obtiene las modificaciones temporarias según los filtros proporcionados
 */
export async function obtenerModificacionesTemporarias(
  queryParams: URLSearchParams
) {
  try {
    // Extraer parámetros de consulta
    const agencia_id = queryParams.get("agencia_id")
      ? parseInt(queryParams.get("agencia_id")!, 10)
      : undefined;
    const tipo = queryParams.get("tipo") || undefined;
    const actividad_id = queryParams.get("actividad_id")
      ? parseInt(queryParams.get("actividad_id")!, 10)
      : undefined;
    const fecha_desde = queryParams.get("fecha_desde") || undefined;
    const fecha_hasta = queryParams.get("fecha_hasta") || undefined;

    // Obtener modificaciones con los filtros aplicados
    const modificaciones = await getModificacionesTemporarias({
      agencia_id,
      tipo,
      actividad_id,
      fecha_desde,
      fecha_hasta,
    });

    if (
      !modificaciones ||
      ("error" in modificaciones && modificaciones.error)
    ) {
      return {
        code: 404,
        message:
          modificaciones?.error ||
          "No se encontraron modificaciones temporarias con los filtros proporcionados",
      };
    }

    return {
      code: 200,
      message: "Modificaciones temporarias obtenidas exitosamente",
      data: modificaciones,
    };
  } catch (err) {
    logError(err, {
      controller: "modificacionTemporariaController",
      method: "obtenerModificacionesTemporarias",
    });
    throw {
      code: 500,
      message: "Error interno al obtener las modificaciones temporarias",
    };
  }
}

/**
 * Actualiza una modificación temporaria existente
 */
export async function actualizarModificacionTemporaria(id: number, body: any) {
  try {
    // Validar datos
    const data = baseModificacionTemporariaSchema.partial().parse(body);

    // Actualizar modificación
    const resultado = await updateModificacionTemporaria(id, data);

    if (!resultado || resultado.error) {
      return {
        code: resultado?.error === "Modificación no encontrada" ? 404 : 400,
        message:
          resultado?.error || "Error al actualizar la modificación temporaria",
      };
    }

    return {
      code: 200,
      message: "Modificación temporaria actualizada exitosamente",
      data: resultado,
    };
  } catch (err) {
    if (err instanceof ZodError) {
      logError(err, {
        controller: "modificacionTemporariaController",
        method: "actualizarModificacionTemporaria",
        errorType: "validationError",
      });
      throw {
        code: 400,
        message: "Datos de modificación temporaria inválidos",
        errors: err.errors,
      };
    }

    logError(err, {
      controller: "modificacionTemporariaController",
      method: "actualizarModificacionTemporaria",
    });
    throw {
      code: 500,
      message: "Error interno al actualizar la modificación temporaria",
    };
  }
}

/**
 * Elimina una modificación temporaria y revierte sus efectos
 */
export async function eliminarModificacionTemporaria(id: number) {
  try {
    const resultado = await deleteModificacionTemporaria(id);

    if (!resultado || resultado.error) {
      return {
        code: resultado?.error === "Modificación no encontrada" ? 404 : 400,
        message:
          resultado?.error || "Error al eliminar la modificación temporaria",
      };
    }

    // Si la reversión fue exitosa, incluir información adicional
    const mensaje = resultado.reversion
      ? `Modificación temporal eliminada exitosamente. ${resultado.reversion.turnosModificados} turnos revertidos.`
      : "Modificación temporal eliminada exitosamente.";

    return {
      code: 200,
      message: mensaje,
      data: resultado.data,
      reversion: resultado.reversion,
    };
  } catch (err) {
    logError(err, {
      controller: "modificacionTemporariaController",
      method: "eliminarModificacionTemporaria",
    });
    throw {
      code: 500,
      message: "Error interno al eliminar la modificación temporaria",
    };
  }
}
