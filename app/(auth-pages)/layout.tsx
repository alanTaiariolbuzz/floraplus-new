"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUser } from "@/context/UserContext";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, customUser, isLoading } = useUser();

  useEffect(() => {
    // Permitir acceso a reset-password incluso si el usuario está autenticado
    if (pathname === "/reset-password") {
      return;
    }

    if (!isLoading && user) {
      // Use customUser.rol_id instead of user.user_metadata.role
      const role =
        customUser?.rol_id === 1 ? "SUPER_ADMIN" : user.user_metadata?.role;
      if (role === "SUPER_ADMIN") {
        router.replace("/admin/panel");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [user, customUser, isLoading, router, pathname]);

  // Si estamos cargando o no hay usuario, mostrar el contenido
  if (isLoading || !user) {
    return <>{children}</>;
  }

  // Si hay usuario y no estamos en reset-password, no mostrar nada (será redirigido)
  if (pathname === "/reset-password") {
    return <>{children}</>;
  }

  return null;
}
