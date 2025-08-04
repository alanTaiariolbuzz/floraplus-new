import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { logError, logInfo } from "@/utils/error/logger";
import { z } from "zod";

// Schema para validar el request body
const tycSchema = z.object({
  contenido: z.string().min(1, "El contenido no puede estar vacío"),
});

/**
 * GET /api/configuracion/tyc
 * Obtiene los términos y condiciones de configuración general usando la primera agencia como referencia
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
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
          success: false,
          message:
            "Acceso denegado. Solo administradores pueden acceder a esta configuración.",
        },
        { status: 403 }
      );
    }

    // Obtener la primera agencia como referencia para los términos y condiciones
    const { data: primeraAgencia, error } = await supabase
      .from("agencias")
      .select("termino_cond")
      .order("id", { ascending: true })
      .limit(1)
      .single();

    if (error) {
      logError("Error al obtener primera agencia para TYC", {
        error,
      });
      return NextResponse.json(
        {
          success: false,
          message: "Error al obtener la configuración",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        contenido:
          primeraAgencia?.termino_cond || "Términos y condiciones por defecto",
      },
    });
  } catch (error: any) {
    logError(error, {
      endpoint: "/api/configuracion/tyc/GET",
      context: "Error al obtener términos y condiciones",
    });

    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/configuracion/tyc
 * Guarda los términos y condiciones de configuración general actualizando la primera agencia
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
          success: false,
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
          success: false,
          message:
            "Acceso denegado. Solo administradores pueden modificar esta configuración.",
        },
        { status: 403 }
      );
    }

    // Validar el body del request
    const body = await request.json();
    const validationResult = tycSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Datos inválidos",
          errors: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { contenido } = validationResult.data;

    // Obtener la primera agencia para actualizarla
    const { data: primeraAgencia, error: getError } = await supabase
      .from("agencias")
      .select("id")
      .order("id", { ascending: true })
      .limit(1)
      .single();

    if (getError || !primeraAgencia) {
      logError("Error al obtener primera agencia para actualizar TYC", {
        error: getError,
      });
      return NextResponse.json(
        {
          success: false,
          message: "Error al obtener la agencia de referencia",
        },
        { status: 500 }
      );
    }

    // Actualizar los términos y condiciones de la primera agencia
    const { error: updateError } = await supabase
      .from("agencias")
      .update({
        termino_cond: contenido,
        updated_at: new Date().toISOString(),
      })
      .eq("id", primeraAgencia.id);

    if (updateError) {
      logError(
        "Error al actualizar términos y condiciones en primera agencia",
        {
          error: updateError,
          agenciaId: primeraAgencia.id,
        }
      );
      return NextResponse.json(
        {
          success: false,
          message: "Error al guardar la configuración",
        },
        { status: 500 }
      );
    }

    logInfo(
      "Términos y condiciones guardados exitosamente en primera agencia",
      {
        agenciaId: primeraAgencia.id,
        contenido: contenido.substring(0, 100) + "...", // Log solo los primeros 100 caracteres
      }
    );

    return NextResponse.json({
      success: true,
      message: "Términos y condiciones guardados exitosamente",
    });
  } catch (error: any) {
    logError(error, {
      endpoint: "/api/configuracion/tyc/POST",
      context: "Error al guardar términos y condiciones",
    });

    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
