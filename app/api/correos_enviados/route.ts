import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function GET(request: NextRequest) {
  const agenciaId = Number(request.headers.get("x-agencia-id"));
  if (!agenciaId) {
    return NextResponse.json(
      { code: 401, message: "Agencia no especificada" },
      { status: 401 }
    );
  }

  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("correos_enviados")
    .select("*")
    .eq("agencia_id", agenciaId);

  if (error) {
    return NextResponse.json(
      { code: 500, message: "Error al cargar correos", error },
      { status: 500 }
    );
  }

  return NextResponse.json({ code: 200, data: { emails: data } });
}
