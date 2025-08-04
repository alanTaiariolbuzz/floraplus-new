import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;
  const redirectTo = requestUrl.searchParams.get("redirect_to")?.toString();
  const type = requestUrl.searchParams.get("type");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error exchanging code for session:", error);
      // Si hay error en el intercambio, redirigir a forgot-password con error
      return NextResponse.redirect(
        `${origin}/forgot-password?error=Invalid or expired reset link. Please request a new password reset.`
      );
    }
  }

  // Si es un reset password, asegurar que redirija a reset-password
  if (type === "recovery" || redirectTo) {
    const targetUrl = redirectTo || "/reset-password";
    return NextResponse.redirect(`${origin}${targetUrl}`);
  }

  // URL to redirect to after sign up process completes
  return NextResponse.redirect(`${origin}/api/auth`);
}
