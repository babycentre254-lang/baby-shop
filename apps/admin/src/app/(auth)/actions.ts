"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { loginSchema, forgotPasswordSchema, resetPasswordSchema, type ApiResponse } from "@baby-shop/shared";

const API_URL = process.env.API_URL ?? "http://localhost:4000/api/v1";

export interface ActionState {
  success: boolean;
  error?: { code: string; message: string };
}

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

async function proxySetCookies(res: Response) {
  const setCookies = res.headers.getSetCookie?.() ?? [];
  if (!setCookies.length) return;

  const store = await cookies();

  for (const raw of setCookies) {
    const [pair, ...attrs] = raw.split(";").map((s) => s.trim());
    const eqIdx = pair.indexOf("=");
    if (eqIdx < 0) continue;

    const name = pair.slice(0, eqIdx);
    const value = pair.slice(eqIdx + 1);
    const opts: Parameters<typeof store.set>[2] = {};

    for (const attr of attrs) {
      const [k, v] = attr.split("=").map((s) => s?.trim() ?? "");
      const key = k.toLowerCase();
      if (key === "path") opts.path = v || "/";
      if (key === "max-age") opts.maxAge = parseInt(v, 10);
      if (key === "expires" && v) opts.expires = new Date(v);
      if (key === "httponly") opts.httpOnly = true;
      if (key === "secure") opts.secure = true;
      if (key === "samesite") {
        const lv = v.toLowerCase();
        if (lv === "strict" || lv === "lax" || lv === "none") {
          opts.sameSite = lv;
        }
      }
      if (key === "domain") opts.domain = v;
    }

    store.set(name, value, opts);
  }
}

export async function adminLoginAction(
  _prev: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    rememberMe: formData.get("rememberMe") === "on",
  });

  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Invalid form",
      },
    };
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    });
  } catch {
    return {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message: "Cannot reach the API. Is the backend running?",
      },
    };
  }

  const json = (await res.json()) as ApiResponse<{ user: any }>;

  if (!json.success) {
    return {
      success: false,
      error: { code: json.error.code, message: json.error.message },
    };
  }

  const role = json.data.user?.role;
  if (!ADMIN_ROLES.includes(role)) {
    return {
      success: false,
      error: {
        code: "NOT_ADMIN",
        message:
          "This account does not have admin access. Use the storefront to sign in.",
      },
    };
  }

  await proxySetCookies(res);
  return { success: true };
}

export async function adminLogoutAction() {
  const store = await cookies();
  const cookieHeader = store.toString();

  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
  } catch {
    /* noop */
  }

  store.delete("access_token");
  store.delete("refresh_token");
  redirect("/login");
}

export async function adminForgotPasswordAction(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { success: false, error: { code: "VALIDATION_ERROR", message: "Enter a valid email address." } };
  return adminAuthForm("forgot-password", parsed.data);
}

export async function adminResetPasswordAction(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse({ email: formData.get("email"), code: formData.get("code"), password: formData.get("password") });
  if (!parsed.success) return { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Check the code and password." } };
  return adminAuthForm("reset-password", parsed.data);
}

async function adminAuthForm(endpoint: "forgot-password" | "reset-password", input: object): Promise<ActionState> {
  try {
    const res = await fetch(`${API_URL}/auth/${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input), cache: "no-store" });
    const json = (await res.json()) as ApiResponse<unknown>;
    if (!json.success) return { success: false, error: { code: json.error.code, message: json.error.message } };
    return { success: true };
  } catch {
    return { success: false, error: { code: "NETWORK_ERROR", message: "Cannot reach the API. Please try again." } };
  }
}
