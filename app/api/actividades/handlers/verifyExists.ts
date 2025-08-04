// app/api/actividades/handlers/verifyExists.ts
import { createClient } from "@/utils/supabase/server";
import { NotFoundError } from "./error-types";

// Lógica mínima: la actividad debe existir y pertenecer a la misma agencia (si aplica)
export async function verifyExists(id: number): Promise<void> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("actividades")
    .select("id")
    .eq("id", id)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    throw new NotFoundError(id);
  }
}
