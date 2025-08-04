import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { createAdminClient } from "@/utils/supabase/admin";
import { cookies } from "next/headers";
import { RolId } from "@/utils/auth/roles";
import { getCookieSettings } from "@/utils/supabase/server";
import { logError, logInfo } from "@/utils/error/logger";


export const withRole =
  (
    allowedIds: RolId[],
    handler: (req: NextRequest) => Promise<NextResponse>
  ) =>
  async (req: NextRequest) => {
    // /* ──────────────────────────────────────────────
    //    1) ¿Viene un Bearer token desde Swagger/Postman?
    // ────────────────────────────────────────────── */
    // // Depurar headers para ver qué está llegando
    // console.log('DEBUG - Headers recibidos:', Object.fromEntries(req.headers.entries()));
    
    // const authHeader = req.headers.get("authorization") ?? "";
    // console.log('DEBUG - Auth header:', authHeader);
    
    // const bearer = authHeader.startsWith("Bearer ")
    //   ? authHeader.slice(7)          // quita "Bearer "
    //   : null;
    // console.log('DEBUG - Bearer token extraído:', bearer ? '(presente)' : '(ausente)');

    /* ──────────────────────────────────────────────
       2) Crea el cliente Supabase adecuado
    ────────────────────────────────────────────── */

    //recuperar rol_id de   const requestHeaders = new Headers(request.headers);
  //requestHeaders.set("x-user-rol", String(userProfile.rol_id));
    const req_headers = new Headers(req.headers);
    const x_user_rol = req_headers.get("x-user-rol");

      
    // Registrar el uso de la autenticación para monitoreo
    logInfo('Auth check in withRole', { 
      x_user_rol
    });

    /* ──────────────────────────────────────────────
       3) Obtiene el usuario e imprime seguridad
    ────────────────────────────────────────────── */
    if (!allowedIds.includes(Number(x_user_rol) as RolId)) {
      return NextResponse.json({ code: 403, message: "Forbidden" });
    }

    // Pasa al handler real
    return handler(req);
  };
