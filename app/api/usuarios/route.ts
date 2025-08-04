import { NextResponse, NextRequest } from "next/server";
import { getUsuarios } from "./services/usuarioService";
import { logError, logInfo } from "@/utils/error/logger";

/**
 * @swagger
 * /api/usuarios:
 *   get:
 *     tags:
 *       - Usuarios
 *     summary: Obtener todos los usuarios de una agencia
 *     description: Permite obtener la lista completa de usuarios (tanto admins como usuarios regulares) de una agencia
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-agencia-id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la agencia para filtrar usuarios
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 resultado:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       nombre:
 *                         type: string
 *                       apellido:
 *                         type: string
 *                       email:
 *                         type: string
 *                         format: email
 *                       rol_id:
 *                         type: integer
 *                       agencia_id:
 *                         type: integer
 *                       activo:
 *                         type: boolean
 *       401:
 *         description: No autorizado
 *       404:
 *         description: No se encontraron usuarios para la agencia especificada
 *       500:
 *         description: Error interno del servidor
 */
export const GET = async (request: NextRequest) => {
  try {
    // Obtener el ID de agencia del header
    const agenciaIdHeader = request.headers.get("x-agencia-id");

    if (!agenciaIdHeader) {
      return NextResponse.json(
        {
          code: 400,
          message: "El header x-agencia-id es requerido",
        },
        { status: 400 }
      );
    }

    const agenciaId = Number(agenciaIdHeader);

    logInfo("Buscando usuarios para agencia", {
      context: "usuarios:GET",
      agenciaId: agenciaId,
    });

    // Obtener todos los usuarios de la agencia
    const usuarios = await getUsuarios({
      agencia_id: agenciaId,
      // activo: true, // Comentado temporalmente para debug
    });

    logInfo("Usuarios encontrados", {
      context: "usuarios:GET",
      agenciaId: agenciaId,
      count: usuarios.length,
      usuarios: usuarios.map(u => ({ id: u.id, email: u.email, agencia_id: u.agencia_id, activo: u.activo }))
    });

    if (usuarios.length === 0) {
      logInfo("No se encontraron usuarios para la agencia especificada", {
        context: "usuarios:GET",
        agenciaId: agenciaId,
      });
      return NextResponse.json(
        {
          code: 404,
          message: "No se encontraron usuarios para la agencia especificada",
        },
        { status: 404 }
      );
    }

    logInfo("Usuarios obtenidos exitosamente", {
      context: "usuarios:GET",
      agenciaId: agenciaId,
      count: usuarios.length,
    });

    return NextResponse.json(
      {
        code: 200,
        resultado: usuarios,
      },
      { status: 200 }
    );
  } catch (error) {
    logError(error, {
      context: "usuarios:GET",
      error: (error as Error).message,
    });

    return NextResponse.json(
      {
        code: 500,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
};
