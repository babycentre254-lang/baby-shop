import { cookies } from "next/headers";
import { authServerApi } from "../api/endpoints.server";

export interface SessionUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: "CUSTOMER" | "ADMIN" | "SUPER_ADMIN";
}

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    if (!cookieHeader.includes("access_token")) return null;

    const res = await authServerApi.me();
    const user = res.user as SessionUser;

    if (!ADMIN_ROLES.includes(user.role)) return null;
    return user;
  } catch {
    return null;
  }
}
