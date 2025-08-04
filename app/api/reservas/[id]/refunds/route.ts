import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { logError, logInfo } from "@/utils/error/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reservaId = parseInt(id, 10);

    if (isNaN(reservaId)) {
      return NextResponse.json(
        { code: 400, message: "ID de reserva inválido" },
        { status: 400 }
      );
    }

    // 1. Verificar autenticación y obtener usuario
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { code: 401, message: "No autorizado" },
        { status: 401 }
      );
    }

    // 2. Obtener datos del usuario y su agencia
    const { data: userData, error: userError } = await supabase
      .from("usuarios")
      .select("agencia_id")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.agencia_id) {
      return NextResponse.json(
        { code: 400, message: "Usuario no tiene agencia asignada" },
        { status: 400 }
      );
    }

    // 3. Verificar que la reserva existe y pertenece a la agencia
    const { data: reserva, error: reservaError } = await supabase
      .from("reservas_detalle")
      .select(
        `
        id,
        turnos!inner (
          agencia_id
        )
      `
      )
      .eq("id", reservaId)
      .single();

    if (reservaError || !reserva) {
      return NextResponse.json(
        { code: 404, message: "Reserva no encontrada" },
        { status: 404 }
      );
    }
    logInfo("Reserva encontrada", {
      reserva,
      userData,
    });

    // Debug: verificar la estructura de turnos
    logInfo("Estructura de turnos", {
      turnos: reserva.turnos,
      turnosType: typeof reserva.turnos,
      isArray: Array.isArray(reserva.turnos),
    });

    // Verificar que la reserva pertenece a la agencia del usuario
    // Manejar tanto si turnos es un array como si es un objeto directo
    const turnosData = reserva.turnos as any;
    const turnoAgenciaId = Array.isArray(turnosData)
      ? turnosData[0]?.agencia_id
      : turnosData?.agencia_id;

    if (turnoAgenciaId !== userData.agencia_id) {
      return NextResponse.json(
        { code: 403, message: "No tienes permisos para ver esta reserva" },
        { status: 403 }
      );
    }

    // 4. Obtener el historial de reembolsos
    const { data: refunds, error: refundsError } = await supabase
      .from("refunds")
      .select(
        `
        id,
        stripe_refund_id,
        amount,
        status,
        created_at,
        updated_at,
        processed_by
      `
      )
      .eq("reserva_id", reservaId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (refundsError) {
      logError(refundsError, {
        context: "refunds",
        reservaId,
        message: "Error al obtener historial de reembolsos",
      });
      return NextResponse.json(
        { code: 500, message: "Error al obtener historial de reembolsos" },
        { status: 500 }
      );
    }

    // 5. Obtener información de los usuarios que autorizaron los reembolsos
    const authorizedByIds = [
      ...new Set(refunds?.map((refund) => refund.processed_by) || []),
    ];

    let usuariosMap: Record<string, any> = {};
    if (authorizedByIds.length > 0) {
      const { data: usuarios, error: usuariosError } = await supabase
        .from("usuarios")
        .select("id, email, nombre, apellido")
        .in("id", authorizedByIds);

      if (!usuariosError && usuarios) {
        usuariosMap = usuarios.reduce(
          (acc, usuario) => {
            acc[usuario.id] = usuario;
            return acc;
          },
          {} as Record<string, any>
        );
      }
    }

    // 6. Formatear la respuesta
    const refundsFormateados = (refunds || []).map((refund) => ({
      id: refund.id,
      stripe_refund_id: refund.stripe_refund_id,
      amount: refund.amount,
      amount_formatted: `$${(refund.amount / 100).toFixed(2)}`,
      status: refund.status,
      created_at: refund.created_at,
      created_at_formatted: new Date(refund.created_at).toLocaleDateString(
        "es-ES",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      ),
      updated_at: refund.updated_at,
      updated_at_formatted: refund.updated_at
        ? new Date(refund.updated_at).toLocaleDateString("es-ES", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : null,
      processed_by: {
        id: refund.processed_by,
        email:
          usuariosMap[refund.processed_by]?.email || "Usuario no encontrado",
        nombre: usuariosMap[refund.processed_by]?.nombre || "",
        apellido: usuariosMap[refund.processed_by]?.apellido || "",
      },
    }));

    logInfo("Historial de reembolsos obtenido", {
      reservaId,
      refundsCount: refundsFormateados.length,
      agenciaId: userData.agencia_id,
    });

    return NextResponse.json({
      code: 200,
      message: "Historial de reembolsos obtenido exitosamente",
      data: {
        reserva_id: reservaId,
        total_refunds: refundsFormateados.length,
        refunds: refundsFormateados,
      },
    });
  } catch (error) {
    logError(error, {
      context: "refunds",
      message: "Error al obtener historial de reembolsos",
    });

    return NextResponse.json(
      {
        code: 500,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
