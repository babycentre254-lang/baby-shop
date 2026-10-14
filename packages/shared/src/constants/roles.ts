export const ROLES = {
  CUSTOMER: "CUSTOMER",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_VALUES: Role[] = Object.values(ROLES);
