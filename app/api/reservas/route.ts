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
  return NextResponse.json(resp, { status: resp.code });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const response = await createReserva(body);

  return NextResponse.json(response, { status: response.code });
}
