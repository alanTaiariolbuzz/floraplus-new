"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROLES } from "@/utils/auth/roles";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required"
    );
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error(error.code + " " + error.message);
    return encodedRedirect("error", "/sign-up", error.message);
  } else {
    return encodedRedirect(
      "success",
      "/sign-up",
      "Thanks for signing up! Please check your email for a verification link."
    );
  }
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Sign in error:", {
      code: error.code,
      message: error.message,
      status: error.status,
    });
    return encodedRedirect("error", "/sign-in", error.message);
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    console.error("No session established after successful sign in");
    return encodedRedirect("error", "/sign-in", "Failed to establish session");
  }

  // Obtener el perfil del usuario para determinar el rol
  const { data: userProfile, error: profileError } = await supabase
    .from("usuarios")
    .select("rol_id")
    .eq("id", session.user.id)
    .single();

  if (profileError || !userProfile) {
    console.error("Error getting user profile:", profileError);
    // Si no podemos obtener el perfil, redirigir al dashboard por defecto
    return redirect("/dashboard");
  }

  // Redirigir según el rol
  if (userProfile.rol_id === ROLES.ADMIN) {
    // SUPER_ADMIN
    return redirect("/admin/panel");
  } else {
    return redirect("/dashboard");
  }
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email) {
    throw new Error("Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/reset-password`,
  });

  if (error) {
    console.error("Password reset error:", error.message);
    throw new Error("Could not reset password. Please try again.");
  }

  // Si no hay error, la operación fue exitosa
  return { success: true };
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return encodedRedirect(
      "error",
      "/reset-password",
      "Contraseña y confirmación de contraseña son requeridos"
    );
  }

  if (password !== confirmPassword) {
    return encodedRedirect(
      "error",
      "/reset-password",
      "Contraseñas no coinciden"
    );
  }

  if (password.length < 8) {
    return encodedRedirect(
      "error",
      "/reset-password",
      "La contraseña debe tener al menos 8 caracteres"
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    return encodedRedirect(
      "error",
      "/reset-password",
      "Actualización de contraseña fallida: " + error.message
    );
  }

  return encodedRedirect(
    "success",
    "/sign-in",
    "Contraseña actualizada correctamente. Por favor, inicie sesión con su nueva contraseña."
  );
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};
