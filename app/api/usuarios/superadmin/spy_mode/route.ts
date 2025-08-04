import { NextResponse, NextRequest } from "next/server";
import { logInfo, logError } from "@/utils/error/logger";
import { asignarIdAgencia } from "./services/spy_modeService";

/**
 * @swagger
 * /api/usuarios/superadmin/spy_mode:
 *   put:
 *     tags:
 *       - Usuarios SuperAdmin Spy Mode
 *     summary: Asigna un ID de agencia al superadmin (Spy Mode)
 *     description: Permite al superadmin acceder temporalmente como un usuario de agencia (agencyuser/agencyadmin) asignándole un ID de agencia.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: agencia_id
 *         required: false
 *         schema:
 *           type: integer
 *           nullable: true
 *         description: ID de la agencia a asignar al superadmin. Si es null, se elimina la asignación.
 *     responses:
 *       200:
 *         description: ID de agencia asignado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Cliente modificado exitosamente
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "uuid-usuario"
 *                     agencia_id:
 *                       type: integer
 *                       nullable: true
 *                       example: 123
 *       400:
 *         description: ID de agencia no válido
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
 *                   example: ID de agencia no válido
 *       404:
 *         description: ID de agencia no encontrado
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
 *                   example: ID de agencia no encontrado
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
 *                   example: Error interno del servidor
 */

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Obtener el id de la agencia y el id del superadmin
    const agenciaId = searchParams.get("agencia_id");
    const userId = String(request.headers.get("x-user-id"));

    if (!userId) {
      return NextResponse.json(
        {
          code: 400,
          message: "El ID del usuario es requerido en el header x-user-id",
        },
        { status: 400 }
      );
    }

    const respuesta = await asignarIdAgencia(Number(agenciaId), userId);

    if (!respuesta) {
      return NextResponse.json(
        { error: "No se obtuvo respuesta" },
        { status: 500 }
      );
    }
    return NextResponse.json(respuesta, { status: respuesta.code });
  } catch (err: any) {
    logError(err, { endpoint: "/api/usuarios/superadmin/spy_mode/PUT" });

    return NextResponse.json(
      {
        code: 500,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
