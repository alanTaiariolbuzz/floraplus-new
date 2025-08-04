import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest) {
  // pido reserva_id y devuelvo el estado de la reserva
  const { searchParams } = new URL(req.url);
  const reservaId = searchParams.get("reserva_id");
  if (!reservaId) {
    return NextResponse.json(
      { code: 400, message: "Debe enviar reserva_id" },
      { status: 400 }
    );
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reservas")
    .select("estado")
    .eq("id", Number(reservaId))
    .single();

  if (error) {
    return NextResponse.json(
      { code: 500, message: "Error al obtener el estado de la reserva", error },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { code: 404, message: "Reserva no encontrada" },
      { status: 404 }
    );
  }

  return NextResponse.json(
    { code: 200, message: "Estado de la reserva obtenido", data: data.estado },
    { status: 200 }
  );
}

//put para actualizar el estado de la reserva
export async function PUT(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reservaId = searchParams.get("reserva_id");
  const estado = searchParams.get("estado");

  if (!reservaId || !estado) {
    return NextResponse.json(
      { code: 400, message: "Debe enviar reserva_id y estado" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const updateFields: any = { estado };
  if (estado === "cancelled" || estado === "cancelada") {
    updateFields.cancelled_at = new Date().toISOString();
  }
  const { data, error } = await supabase
    .from("reservas")
    .update(updateFields)
    .eq("id", Number(reservaId))
    .select("estado, cancelled_at")
    .single();

  if (error) {
    return NextResponse.json(
      {
        code: 500,
        message: "Error al actualizar el estado de la reserva",
        error,
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      code: 200,
      message: "Estado de la reserva actualizado",
      data: data.estado,
    },
    { status: 200 }
  );
}
