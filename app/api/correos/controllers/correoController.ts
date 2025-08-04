import { NextRequest, NextResponse } from "next/server";
import { logError, logInfo } from "../../../../utils/error/logger";
import {
  getCorreos,
  getCorreoByAgenciaId,
  createCorreo,
  updateCorreo,
  deleteCorreo,
} from "../services/correoService";
import { FiltrosCorreo } from "../types";

/**
 * Obtiene la configuración de correos con filtros opcionales
 */
export async function getCorreosFiltradas(filtros: FiltrosCorreo = {}) {
  try {
    const data = await getCorreos(filtros);
    return NextResponse.json(
      {
        code: 200,
        message: "Configuración de correos obtenida exitosamente",
        data,
      },
      { status: 200 }
    );
  } catch (error: any) {
    logError("Error en getCorreosFiltradas", {
      context: "correoController",
      error,
      filtros,
    });

    return NextResponse.json(
      {
        code: 500,
        message: "Error al obtener configuración de correos",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Obtiene la configuración de correos por agencia_id
 */
export async function getCorreoPorAgencia(agenciaId: number) {
  try {
    const data = await getCorreoByAgenciaId(agenciaId);

    if (!data) {
      return NextResponse.json(
        {
          code: 404,
          message: "Configuración de correos no encontrada",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        code: 200,
        message: "Configuración de correos obtenida exitosamente",
        data,
      },
      { status: 200 }
    );
  } catch (error: any) {
    logError("Error en getCorreoPorAgencia", {
      context: "correoController",
      error,
      agenciaId,
    });

    return NextResponse.json(
      {
        code: 500,
        message: "Error al obtener configuración de correos",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Crea una nueva configuración de correos
 */
export async function crearNuevaConfiguracionCorreos(correoData: any) {
  try {
    logInfo("Creando nueva configuración de correos", {
      context: "correoController",
      agencia_id: correoData.agencia_id,
    });

    const data = await createCorreo(correoData);

    return NextResponse.json(
      {
        code: 201,
        message: "Configuración de correos creada exitosamente",
        data,
      },
      { status: 201 }
    );
  } catch (error: any) {
    logError("Error en crearNuevaConfiguracionCorreos", {
      context: "correoController",
      error,
      correoData,
    });

    // Manejar errores específicos
    if (error.code === "23505") {
      return NextResponse.json(
        {
          code: 409,
          message: "Ya existe una configuración de correos para esta agencia",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        code: 500,
        message: "Error al crear configuración de correos",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Actualiza una configuración de correos existente
 */
export async function actualizarConfiguracionCorreos(
  agenciaId: number,
  correoData: any
) {
  try {
    logInfo("Actualizando configuración de correos", {
      context: "correoController",
      agencia_id: agenciaId,
    });

    const data = await updateCorreo(agenciaId, correoData);

    return NextResponse.json(
      {
        code: 200,
        message: "Configuración de correos actualizada exitosamente",
        data,
      },
      { status: 200 }
    );
  } catch (error: any) {
    logError("Error en actualizarConfiguracionCorreos", {
      context: "correoController",
      error,
      agencia_id: agenciaId,
    });

    // Manejar errores específicos
    if (error.code === 404) {
      return NextResponse.json(
        {
          code: 404,
          message: "Configuración de correos no encontrada",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        code: 500,
        message: "Error al actualizar configuración de correos",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Elimina una configuración de correos
 */
export async function eliminarConfiguracionCorreos(agenciaId: number) {
  try {
    logInfo("Eliminando configuración de correos", {
      context: "correoController",
      agencia_id: agenciaId,
    });

    await deleteCorreo(agenciaId);

    return NextResponse.json(
      {
        code: 200,
        message: "Configuración de correos eliminada exitosamente",
      },
      { status: 200 }
    );
  } catch (error: any) {
    logError("Error en eliminarConfiguracionCorreos", {
      context: "correoController",
      error,
      agencia_id: agenciaId,
    });

    return NextResponse.json(
      {
        code: 500,
        message: "Error al eliminar configuración de correos",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
