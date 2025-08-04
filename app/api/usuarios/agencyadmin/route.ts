import { NextResponse, NextRequest } from "next/server";
import { inviteAgencyAdminUser } from "@/utils/auth/invite";
import { agencyadminSchema } from "./schemas/schema";
import { logError, logInfo } from "@/utils/error/logger";
import { getUsuariosbyAgencia } from "./services/agencyadminService";

/**
 * @swagger
 * /api/usuarios/agencyadmin:
 *   post:
 *     tags:
 *       - Usuarios
 *     summary: Invitar administrador de agencia
 *     description: Permite invitar a un usuario como administrador para una agencia existente
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - email
 *               - agencia_id
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre completo del usuario
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email del usuario
 *               telefono:
 *                 type: string
 *                 description: Teléfono del usuario (opcional)
 *               agencia_id:
 *                 type: integer
 *                 description: ID de la agencia a la que pertenecerá el administrador
 *     responses:
 *       201:
 *         description: Usuario invitado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 201
 *                 message:
 *                   type: string
 *       400:
 *         description: Datos de entrada inválidos o error en la invitación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 400
 *                 message:
 *                   type: string
 *                 errors:
 *                   type: object
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Permisos insuficientes
 */
export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();

    logInfo(`Iniciando invitación de admin para agencia ${body.agencia_id}`, {
      context: "usuarios:agencyadmin:POST",
    });

    // Validar datos de entrada
    const parsed_body = agencyadminSchema.safeParse(body);
    if (!parsed_body.success) {
      logError(parsed_body.error, {
        context: "usuarios:agencyadmin:POST",
        fase: "validación",
      });

      return NextResponse.json(
        {
          code: 400,
          message: "Datos de entrada inválidos",
          errors: parsed_body.error.format(),
          isValidationError: true,
        },
        { status: 400 }
      );
    }

    const data = parsed_body.data;

    // Invitar al usuario como admin de agencia
    const result = await inviteAgencyAdminUser({
      email: data.email,
      nombre: data.nombre,
      apellido: data.apellido,
      telefono: data.telefono,
      agencia_id: data.agencia_id,
    });

    if (result instanceof Error) {
      logError(result, {
        context: "usuarios:agencyadmin:POST",
        fase: "invitación",
        details: { email: data.email, agencia_id: data.agencia_id },
      });

      return NextResponse.json(
        {
          code: 400,
          message: `Error al invitar usuario: ${result.message}`,
        },
        { status: 400 }
      );
    }

    logInfo(`Invitación enviada exitosamente a ${data.email}`, {
      context: "usuarios:agencyadmin:POST",
      details: { email: data.email, agencia_id: data.agencia_id },
    });

    return NextResponse.json(
      {
        code: 201,
        message: `Invitación enviada a ${data.email}`,
      },
      { status: 201 }
    );
  } catch (err) {
    logError(err, {
      context: "usuarios:agencyadmin:POST",
      fase: "general",
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

/**
 * @swagger
 * /api/usuarios/agencyadmin:
 *   get:
 *     tags:
 *       - Usuarios
 *     summary: Obtener usuarios de agencia
 *     description: Permite obtener la lista de usuarios regulares de una agencia
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
 *         description: Lista de usuarios de agencia obtenida exitosamente
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
 *                         type: integer
 *                       nombre:
 *                         type: string
 *                       email:
 *                         type: string
 *                         format: email
 *                       agencia_id:
 *                         type: integer
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Permisos insuficientes
 *       404:
 *         description: No se encontraron usuarios para la agencia especificada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 404
 *                 message:
 *                   type: string
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 500
 *                 message:
 *                   type: string
 */
export const GET = async (request: NextRequest) => {
  try {
    //Busco el id de agencia del usuario en el header
    const agenciaIdHeader = request.headers.get("x-agencia-id");
    let resultado: any[] = [];

    if (agenciaIdHeader) {
      resultado = await getUsuariosbyAgencia(Number(agenciaIdHeader));
    }
    if (resultado.length === 0) {
      logInfo("No se encontraron usuarios para la agencia especificada", {
        context: "usuarios:agencyadmin:GET",
        agenciaId: agenciaIdHeader,
      });
      return NextResponse.json(
        {
          code: 404,
          message: "No se encontraron usuarios para la agencia especificada",
        },
        { status: 404 }
      );
    }

    logInfo("Usuarios obtenidos exitosamente");
    return NextResponse.json({ code: 200, resultado }, { status: 200 });
  } catch (err) {
    logError(err, { endpoint: "/api/usuarios/agencyadmin/GET" });
    return NextResponse.json(
      {
        code: 500,
        message: "Error al obtener transportes",
      },
      { status: 500 }
    );
  }
};
