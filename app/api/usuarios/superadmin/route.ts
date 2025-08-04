import { NextResponse, NextRequest } from "next/server";
import { withRole } from "@/utils/auth/withRole";
import { inviteAdminUser } from "@/utils/auth/invite";
import { ROLES } from "@/utils/auth/roles";
import { logInfo, logError } from "@/utils/error/logger";
import {
  getSuperAdminUsers,
  updateSuperAdminUser,
} from "../superadmin/services/superadminService";

export const POST = withRole([ROLES.ADMIN], async (req: NextRequest) => {
  const { email, nombre, apellido } = await req.json();
  // The inviteAdminUser function defaults to 'SUPER_ADMIN' role if not specified.
  const r = await inviteAdminUser({
    email,
    nombre,
    apellido,
  });

  if (r instanceof Error) {
    return NextResponse.json({ code: 400, message: r.message });
  }

  return NextResponse.json({
    code: 201,
    message: "Invitación enviada a " + email,
  });
});

export const PUT = withRole([ROLES.ADMIN], async (req: NextRequest) => {
  try {
    const { id, nombre, email } = await req.json();

    if (!id || !nombre || !email) {
      return NextResponse.json({
        code: 400,
        message: "ID, nombre y email son requeridos",
      });
    }

    const updatedUser = await updateSuperAdminUser(id, { nombre, email });

    return NextResponse.json({
      code: 200,
      message: "Usuario actualizado exitosamente",
      resultado: updatedUser,
    });
  } catch (error) {
    logError("Error al actualizar usuario superadmin", {
      context: "usuarios:superadmin:put",
      error: (error as Error).message,
    });
    return NextResponse.json({
      code: 500,
      message: "Error al actualizar usuario superadmin",
    });
  }
});

/**
 * @swagger
 * /api/usuarios/superadmin:
 *   get:
 *     tags:
 *       - Usuarios
 *     summary: Obtener usuarios de agencia
 *     description: Permite obtener la lista de usuarios regulares de una agencia
 *     security:
 *       - bearerAuth: []
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
 *       500:
 *         description: Error al obtener transportes
 */
export const GET = async (request: NextRequest) => {
  try {
    let resultado: any[] = [];

    resultado = await getSuperAdminUsers();
    if (resultado.length === 0) {
      return NextResponse.json({
        code: 404,
        message: "No se encontraron usuarios superadmin",
      });
    }
    return NextResponse.json({ code: 200, resultado });
  } catch (error) {
    logError("Error al obtener usuarios superadmin", {
      context: "usuarios:superadmin:get",
      error: (error as Error).message,
    });
    return NextResponse.json({
      code: 500,
      message: "Error al obtener usuarios superadmin",
    });
  }
};
