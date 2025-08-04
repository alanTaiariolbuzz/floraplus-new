export type UserRole = "SUPER_ADMIN" | "AGENCY_ADMIN" | "AGENCY_USER";

export const isAdminRole = (
  role: string | undefined
): role is "SUPER_ADMIN" => {
  return role === "SUPER_ADMIN";
};
