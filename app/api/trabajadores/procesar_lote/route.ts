export const runtime = "edge"; // correcto para Next 15+

import { createAdminClient } from "@/utils/supabase/admin";
import { eventHandlers } from "@/src/backend/events";
import { enrichEventPayload } from "@/src/backend/events/enrichEvent";
import { sendEmail } from "@/utils/email/service"; // Asegúrate de tener este servicio

const MAX_INTENTOS = 5;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "manuel@labba.studio";

export async function GET() {

  //desahabilitar por el momento
  return new Response("Deshabilitado temporalmente", { status: 503 });
  const supabase = createAdminClient();

  // 1️⃣ reclamar en una sola llamada y devolver los registros reclamados
  const { data: eventos, error } = await supabase
    .from("eventos")
    .update({ estado: "en_proceso" })
    .eq("estado", "pendiente")
    .order("origen", { ascending: false })      // 'stripe' primero
    .order("recibido_en", { ascending: true })
    .limit(100)
    .select("*");                               // <- devuelve los 100 que acabas de marcar

  if (error) {
    console.error("error seleccionando eventos", error);
    return new Response("error", { status: 500 });
  }

  // 2️⃣ procesa uno a uno (Edge = 10 ms CPU máx; mantén I/O corto)
  for (const ev of eventos ?? []) {
      try {
        const payload = enrichEventPayload(ev);
        const handlers = eventHandlers[ev.tipo] ?? [];

      for (const handler of handlers) {
        const result = await handler(payload);
        if (typeof result === 'object' && result !== null && 'success' in result && result.success === false) {
          throw new Error(result.error || "Error desconocido en handler");
        }
      }

      await supabase
        .from("eventos")
        .update({ estado: "procesado", procesado_en: new Date() })
        .eq("id", ev.id);
    } catch (e) {
      const nuevosIntentos = (ev.intentos ?? 0) + 1;
      let nuevoEstado = "error";
      if (nuevosIntentos >= MAX_INTENTOS) {
        nuevoEstado = "fallido";
        // Enviar email al admin
        await sendEmail({
          to: ADMIN_EMAIL,
          subject: `Evento fallido tras ${MAX_INTENTOS} intentos`,
          template: "evento-fallido", // Usa un template adecuado
          data: {
            id: ev.id,
            tipo: ev.tipo,
            error: String(e).slice(0, 500),
            payload: JSON.stringify(ev.payload),
            fecha: new Date().toISOString(),
          },
        });
      }
      await supabase
        .from("eventos")
        .update({
          estado: nuevoEstado,
          intentos: nuevosIntentos,
          error_msg: String(e).slice(0, 500),
          ultimo_intento: new Date(),
        })
      console.error("fallo", ev.id, e);
    }
    }
  }



