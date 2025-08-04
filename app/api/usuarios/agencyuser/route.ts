import { NextResponse, NextRequest } from "next/server";
import { withRole } from "@/utils/auth/withRole";
import { inviteAgencyUser } from "@/utils/auth/invite";
import { ROLES } from "@/utils/auth/roles";
import { AgencyUserInput, agencyUserSchema } from "./schemas/schema";
import { logError, logInfo } from "@/utils/error/logger";

/**
 * @swagger
 * /api/usuarios/agencyuser:
 *   post:
 *     tags:
 *       - Usuarios
 *     summary: Invitar usuario regular de agencia
 *     description: Permite invitar a un usuario regular (no administrador) para una agencia existente
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
 *               - rol_id
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre completo del usuario
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email del usuario
 *               agencia_id:
 *                 type: integer
 *                 description: ID de la agencia a la que pertenecerá el usuario
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

    logInfo(`Iniciando invitación de usuario para agencia ${body.agencia_id}`, {
      context: "usuarios:agencyuser:POST",
    });

    // Validar datos de entrada
    const parsed_body = agencyUserSchema.safeParse(body);
    if (!parsed_body.success) {
      logError(parsed_body.error, {
        context: "usuarios:agencyuser:POST",
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

    // Invitar al usuario como usuario de agencia
    const result = await inviteAgencyUser({
      email: data.email,
      nombre: data.nombre,
      apellido: data.apellido,
      agencia_id: data.agencia_id,
    });

    if (result instanceof Error) {
      logError(result, {
        context: "usuarios:agencyuser:POST",
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
      context: "usuarios:agencyuser:POST",
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
      context: "usuarios:agencyuser:POST",
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
