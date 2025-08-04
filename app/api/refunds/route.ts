import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const created_at = searchParams.get("created_at");

  if (!created_at) {
    return NextResponse.json(
      { code: 400, message: "Debe enviar created_at" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  // Filtrar refunds del día y status completed
  const date = new Date(created_at);
  const startOfDay = new Date(date.setHours(0, 0, 0, 0)).toISOString();
  const endOfDay = new Date(date.setHours(23, 59, 59, 999)).toISOString();

  const { data, error } = await supabase
    .from("refunds")
    .select("*")
    .gte("created_at", startOfDay)
    .lte("created_at", endOfDay)
    .eq("status", "completed");

  if (error) {
    return NextResponse.json(
      { code: 500, message: "Error al obtener refunds", error },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { code: 200, message: "Refunds obtenidos", data },
    { status: 200 }
  );
}
