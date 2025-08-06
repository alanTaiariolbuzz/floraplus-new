import { NextRequest, NextResponse } from "next/server";
import { createReserva, getReservas } from "./controllers/reservaController";
import "./docs/swagger";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const actividadId = searchParams.get("actividad_id");
  const turnoId = searchParams.get("turno_id");
  const agenciaIdHeader = req.headers.get("x-agencia-id");
  const created_at = searchParams.get("created_at");
  const cancelled_at = searchParams.get("cancelled_at");

  // if (!id && !actividadId && !turnoId) {
  //   return NextResponse.json(
  //     { code: 400, message: 'Debe enviar id, actividad_id o turno_id' },
  //     { status: 400 }
  //   );
  // }

  const filtros = {
    id: id ? Number(id) : undefined,
    actividad_id: actividadId ? Number(actividadId) : undefined,
    turno_id: turnoId ? Number(turnoId) : undefined,
    agencia_id: agenciaIdHeader ? Number(agenciaIdHeader) : undefined,
    created_at: created_at || undefined,
    cancelled_at: cancelled_at || undefined,
  };

  const resp = await getReservas(filtros);

  // Validar y corregir reservas con estado inconsistente
  if (resp.data && Array.isArray(resp.data)) {
    const { createClient } = await import("@/utils/supabase/server");
    const supabase = await createClient();

    for (const reserva of resp.data) {
      // Detectar reservas con estado inconsistente: confirmada pero con cancelled_at
      if (reserva.estado === "confirmada" && reserva.cancelled_at) {
        console.warn(
          `Reserva con estado inconsistente detectada: ID ${reserva.id} - estado: ${reserva.estado}, cancelled_at: ${reserva.cancelled_at}`
        );

        // Corregir automáticamente: limpiar cancelled_at si el estado es confirmada
        const { error: updateError } = await supabase
          .from("reservas")
          .update({
            cancelled_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", reserva.id)
          .eq("estado", "confirmada");

        if (updateError) {
          console.error(
            `Error corrigiendo reserva ${reserva.id}:`,
            updateError
          );
        } else {
          console.log(`Reserva ${reserva.id} corregida: cancelled_at limpiado`);
          // Actualizar el objeto en la respuesta
          reserva.cancelled_at = null;
        }
      }
    }
  }

  return NextResponse.json(resp, { status: resp.code });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const response = await createReserva(body);

  return NextResponse.json(response, { status: response.code });
}
