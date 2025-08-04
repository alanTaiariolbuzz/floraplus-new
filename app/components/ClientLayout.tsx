"use client";

import { useEffect } from "react";
import { UserProvider, useUser } from "@/context/UserContext";
import { RoleProvider } from "@/app/context/RoleContext";
import { User } from "@supabase/supabase-js";

function RoleProviderWrapper({ children }: { children: React.ReactNode }) {
  const { user, customUser } = useUser();
  
  return (
    <RoleProvider user={user} customUser={customUser}>
      {children}
    </RoleProvider>
  );
}

export default function ClientLayout({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: User | null;
}) {
  // Elimina el loader inicial cuando React monta
  useEffect(() => {
    const loader = document.getElementById("initial-loader");
    if (loader) {
      loader.remove();
    }
  }, []);

  return (
    <UserProvider initialUser={initialUser}>
      <RoleProviderWrapper>
        {children}
      </RoleProviderWrapper>
    </UserProvider>
  );
}
