export const ROLES = {
    ADMIN: 1,
    AGENCY_ADMIN: 2,
    AGENCY_USER: 3
  } as const;
  
  export type RolNombre = keyof typeof ROLES;
  export type RolId = (typeof ROLES)[RolNombre];  