import "server-only";

import { authServerApi } from "../api/endpoints.server";

export interface SessionUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  phone?: string;
  isEmailVerified?: boolean;
  createdAt?: string;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const res = await authServerApi.me();
    return res.user as SessionUser;
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}
