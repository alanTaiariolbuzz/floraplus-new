import { NextResponse, type NextRequest } from "next/server";
import { getUserProfile } from "./utils/auth/profile";
import { createClient, updateSession } from "./utils/supabase/middleware";
import { ROLES } from "./utils/auth/roles";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Verificar si es una ruta de confirmación de reserva (pública)
  const isReservaConfirmar = /^\/api\/reservas\/\d+\/confirmar$/.test(path);

  // Ignorar archivos estáticos, rutas de API y rutas públicas
  if (
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.includes(".") ||
    isReservaConfirmar ||
    [
      "/sign-in",
      "/auth/callback",
      "/forgot-password",
      "/reset-password",
      "/onboarding/stripe-setup",
      "/auth/admin-complete",
      "/auth/agencyadmin-complete",
      "/auth/agencyuser-complete",
      "/auth/onboarding/complete",
      "/api/webhooks/stripe",
      "/api/trabajadores/procesar_lote ",
      "/api/public/turnos",
      "/api/public/tarifas",
      "/api/public/actividades",
      "/api/public/reservas",
      "/api/agencias",
      "/api/pagos/checkout",
      "/api/pagos/checkout/session",
      "/api/pagos/test",
      "/api/pagos/configure-payout",
      "/checkout/return",
      "/api/debug/",
      "/api/test-update",
      "/api/cron/move-abandoned-reservations",
    ].some((publicPath) => request.nextUrl.pathname.startsWith(publicPath))
  ) {
    return NextResponse.next();
  }

  // Solo proteger rutas dentro de (protected)
  // incluir rutas api
  if (!path.startsWith("/(protected)") && !path.startsWith("/api")) {
    return NextResponse.next();
  }

  const { supabase, response } = createClient(request);
  await updateSession(request);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Si no hay sesión y es una ruta protegida, redirigir a sign-in
  if (!session) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Obtener perfil del usuario
  const userProfile = await getUserProfile(session.user.id);

  if (!userProfile) {
    console.error("No se pudo obtener el perfil del usuario");
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Agregar headers con la información del usuario
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-rol", String(userProfile.rol_id));
  if (userProfile.agencia_id) {
    requestHeaders.set("x-agencia-id", String(userProfile.agencia_id));
  }
  if (userProfile.id) {
    requestHeaders.set("x-user-id", userProfile.id);
  }
  const accessToken = request.cookies.get("sb-access-token")?.value;
  if (accessToken) {
    requestHeaders.set("authorization", `Bearer ${accessToken}`);
  }

  const modifiedResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Redirigir según el rol
  // Los administradores pueden acceder a cualquier ruta
  if (
    (userProfile.rol_id === ROLES.AGENCY_USER ||
      userProfile.rol_id === ROLES.AGENCY_ADMIN) &&
    request.nextUrl.pathname.startsWith("/admin")
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return modifiedResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
