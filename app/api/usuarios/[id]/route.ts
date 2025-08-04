import { NextResponse, NextRequest } from "next/server";
import { logError, logInfo } from "@/utils/error/logger";
import { createClient } from "@/utils/supabase/server";

/**
 * @swagger
 * /api/usuarios/{id}:
 *   delete:
 *     tags:
 *       - Usuarios
 *     summary: Eliminar un usuario
 *     description: Permite eliminar un usuario específico de una agencia
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario a eliminar
 *       - in: header
 *         name: x-agencia-id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la agencia
 *     responses:
 *       200:
 *         description: Usuario eliminado exitosamente
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
export const DELETE = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id: userId } = await params;
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

    logInfo("Intentando eliminar usuario", {
      context: "usuarios:DELETE",
      userId: userId,
      agenciaId: agenciaId,
    });

    const supabase = await createClient();

    // Primero verificar que el usuario existe y pertenece a la agencia
    const { data: usuario, error: fetchError } = await supabase
      .from("usuarios")
      .select("id, rol_id, agencia_id")
      .eq("id", userId)
      .eq("agencia_id", agenciaId)
      .single();

    if (fetchError || !usuario) {
      logInfo("Usuario no encontrado o no pertenece a la agencia", {
        context: "usuarios:DELETE",
        userId: userId,
        agenciaId: agenciaId,
        error: fetchError?.message,
      });
      return NextResponse.json(
        {
          code: 404,
          message: "Usuario no encontrado",
        },
        { status: 404 }
      );
    }

    // Verificar que no sea un administrador (rol_id = 2)
    if (usuario.rol_id === 2) {
      logInfo("Intento de eliminar administrador bloqueado", {
        context: "usuarios:DELETE",
        userId: userId,
        agenciaId: agenciaId,
        rol_id: usuario.rol_id,
      });
      return NextResponse.json(
        {
          code: 403,
          message: "No se puede eliminar un administrador",
        },
        { status: 403 }
      );
    }

    // Eliminar el usuario
    const { error: deleteError } = await supabase
      .from("usuarios")
      .delete()
      .eq("id", userId)
      .eq("agencia_id", agenciaId);

    if (deleteError) {
      logError(deleteError, {
        context: "usuarios:DELETE",
        userId: userId,
        agenciaId: agenciaId,
        error: deleteError.message,
      });
      return NextResponse.json(
        {
          code: 500,
          message: "Error al eliminar usuario",
        },
        { status: 500 }
      );
    }

    logInfo("Usuario eliminado exitosamente", {
      context: "usuarios:DELETE",
      userId: userId,
      agenciaId: agenciaId,
    });

    return NextResponse.json(
      {
        code: 200,
        message: "Usuario eliminado exitosamente",
      },
      { status: 200 }
    );
  } catch (error) {
    logError(error, {
      context: "usuarios:DELETE",
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
