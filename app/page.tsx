import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ROLES } from "@/utils/auth/roles";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    // Obtener el perfil del usuario para determinar el rol
    const { data: userProfile, error: profileError } = await supabase
      .from("usuarios")
      .select("rol_id")
      .eq("id", session.user.id)
      .single();

    if (profileError || !userProfile) {
      console.error("Error getting user profile:", profileError);
      // Si no podemos obtener el perfil, redirigir al dashboard por defecto
      redirect("/dashboard");
    }

    // Redirigir según el rol
    if (userProfile.rol_id === ROLES.ADMIN) {
      // SUPER_ADMIN
      redirect("/admin/panel");
    } else {
      redirect("/dashboard");
    }
  } else {
    redirect("/sign-in");
  }
}
