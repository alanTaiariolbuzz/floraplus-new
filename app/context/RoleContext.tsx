"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { UserRole } from "../types/roles";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { ROLES } from "@/utils/auth/roles";

interface RoleContextType {
  userRole: UserRole;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

// Helper function to map rol_id to UserRole
const mapRolIdToUserRole = (rolId: number): UserRole => {
  switch (rolId) {
    case ROLES.ADMIN:
      return "SUPER_ADMIN";
    case ROLES.AGENCY_ADMIN:
      return "AGENCY_ADMIN";
    case ROLES.AGENCY_USER:
      return "AGENCY_USER";
    default:
      return "AGENCY_USER"; // Default fallback
  }
};

export function RoleProvider({
  children,
  user,
  customUser,
}: {
  children: ReactNode;
  user: User | null;
  customUser: any | null;
}) {
  const [userRole, setUserRole] = useState<UserRole>("AGENCY_USER");

  useEffect(() => {
    // Use customUser.rol_id instead of user.user_metadata.role
    if (customUser?.rol_id) {
      setUserRole(mapRolIdToUserRole(customUser.rol_id));
    } else if (user?.user_metadata?.role) {
      // Fallback to user_metadata for backward compatibility during transition
      setUserRole(user.user_metadata.role as UserRole);
    }
  }, [user, customUser]);

  return (
    <RoleContext.Provider value={{ userRole }}>{children}</RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}

export function useRoleCheck() {
  const { userRole } = useRole();
  const router = useRouter();

  const checkAdminAccess = () => {
    if (userRole !== "SUPER_ADMIN") {
      router.replace("/dashboard");
      return false;
    }
    return true;
  };

  return { checkAdminAccess };
}
