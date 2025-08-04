import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { logError, logInfo } from "@/utils/error/logger";
import { z } from "zod";

// Schema para validar el request body
const bulkUpdateTyCSchema = z.object({
  termino_cond: z
    .string()
    .min(1, "Los términos y condiciones no pueden estar vacíos"),
});

/**
 * POST /api/agencias/bulk-update-tyc
 * Actualiza los términos y condiciones de todas las agencias activas
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          code: 401,
          message: "No autorizado",
        },
        { status: 401 }
      );
    }

    // Verificar que el usuario sea admin
    const { data: userData } = await supabase
      .from("usuarios")
      .select("rol_id")
      .eq("id", user.id)
      .single();

    if (userData?.rol_id !== 1) {
      return NextResponse.json(
        {
          code: 403,
          message:
            "Acceso denegado. Solo administradores pueden realizar esta acción.",
        },
        { status: 403 }
      );
    }

    // Validar el body del request
    const body = await request.json();
    const validationResult = bulkUpdateTyCSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          code: 400,
          message: "Datos inválidos",
          errors: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { termino_cond } = validationResult.data;

    // Obtener todas las agencias activas
    const { data: agencies, error: agenciesError } = await supabase
      .from("agencias")
      .select("id, nombre_comercial")
      .eq("activa", true);

    if (agenciesError) {
      logError("Error al obtener agencias activas", {
        error: agenciesError,
      });
      return NextResponse.json(
        {
          code: 500,
          message: "Error al obtener agencias",
        },
        { status: 500 }
      );
    }

    if (!agencies || agencies.length === 0) {
      return NextResponse.json({
        code: 200,
        message: "No hay agencias activas para actualizar",
        data: {
          total: 0,
          successful: 0,
          failed: 0,
          results: [],
        },
      });
    }

    // Actualizar todas las agencias activas
    const { error: updateError } = await supabase
      .from("agencias")
      .update({
        termino_cond: termino_cond,
        updated_at: new Date().toISOString(),
      })
      .eq("activa", true);

    if (updateError) {
      logError("Error al actualizar términos y condiciones", {
        error: updateError,
      });
      return NextResponse.json(
        {
          code: 500,
          message: "Error al actualizar términos y condiciones",
        },
        { status: 500 }
      );
    }

    logInfo("Términos y condiciones actualizados masivamente", {
      total: agencies.length,
      termino_cond: termino_cond.substring(0, 100) + "...", // Log solo los primeros 100 caracteres
    });

    return NextResponse.json({
      code: 200,
      message: `Términos y condiciones actualizados exitosamente para ${agencies.length} agencias`,
      data: {
        total: agencies.length,
        successful: agencies.length,
        failed: 0,
        results: agencies.map((agency) => ({
          agencyId: agency.id,
          agencyName: agency.nombre_comercial,
          success: true,
        })),
      },
    });
  } catch (error: any) {
    logError(error, {
      endpoint: "/api/agencias/bulk-update-tyc",
      context: "Error al actualizar términos y condiciones masivamente",
    });

    return NextResponse.json(
      {
        code: 500,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
