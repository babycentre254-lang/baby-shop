"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  type LoginInput,
  type RegisterInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type VerifyEmailInput,
  type ApiResponse,
} from "@baby-shop/shared";

const API_URL = (process.env.API_URL ?? "http://127.0.0.1:4000/api/v1").replace(/[./]+$/, "");

export interface ActionState {
  success: boolean;
  verificationRequired?: boolean;
  email?: string;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

/**
 * Shared: forward Set-Cookie headers from the API response to the browser.
 * httpOnly + Secure + SameSite all preserved.
 */
async function proxySetCookies(res: Response) {
  const setCookies = res.headers.getSetCookie?.() ?? [];
  if (setCookies.length === 0) return;

  const store = await cookies();

  for (const raw of setCookies) {
    // Parse "name=value; Attr1=...; Attr2=..."
    const [pair, ...attrs] = raw.split(";").map((s) => s.trim());
    const eqIdx = pair.indexOf("=");
    if (eqIdx < 0) continue;

    const name = pair.slice(0, eqIdx);
    const value = pair.slice(eqIdx + 1);

    const opts: Parameters<typeof store.set>[2] = {};
    for (const attr of attrs) {
      const [k, v] = attr.split("=").map((s) => s?.trim() ?? "");
      const key = k.toLowerCase();

      if (key === "path") opts.path = name === "refresh_token" ? "/" : v || "/";
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

    if (name === "refresh_token") {
      store.set(name, "", {
        path: "/api/v1/auth",
        maxAge: 0,
        httpOnly: true,
        sameSite: opts.sameSite ?? "lax",
        secure: opts.secure ?? false,
      });
      opts.path = "/";
    }
    store.set(name, value, opts);
  }
}

export async function loginAction(
  _prev: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
    rememberMe: formData.get("rememberMe") === "on",
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Please check the form",
        details: parsed.error.flatten().fieldErrors,
      },
    };
  }

  const input: LoginInput = parsed.data;

  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      cache: "no-store",
    });
  } catch {
    return {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message: "Could not reach the server. Try again.",
      },
    };
  }

  const json = (await res.json()) as ApiResponse<{ user: any }>;

  if (!json.success) {
    return {
      success: false,
      email: json.error.code === "EMAIL_NOT_VERIFIED" ? input.email : undefined,
      error: {
        code: json.error.code,
        message: json.error.message,
        details: (json.error.details as Record<string, string[]>) ?? undefined,
      },
    };
  }

  await proxySetCookies(res);

  // Role check — customers only on storefront
  const role = json.data.user?.role;
  if (role === "ADMIN" || role === "SUPER_ADMIN") {
    // Optional: allow admin login here but redirect to /admin later.
    // For now, block them from the customer storefront.
    // (comment out if you want to allow)
  }

  return { success: true };
}

export async function forgotPasswordAction(
  _prev: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Enter a valid email address.",
        details: parsed.error.flatten().fieldErrors,
      },
    };
  }

  return sendAuthForm("forgot-password", parsed.data);
}

export async function resetPasswordAction(
  _prev: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse({
    email: formData.get("email"),
    code: formData.get("code"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Review the code and password below.",
        details: parsed.error.flatten().fieldErrors,
      },
    };
  }

  return sendAuthForm("reset-password", parsed.data);
}

async function sendAuthForm(
  endpoint: "forgot-password" | "reset-password" | "resend-verification",
  input: ForgotPasswordInput | ResetPasswordInput
): Promise<ActionState> {
  try {
    const res = await fetch(`${API_URL}/auth/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      cache: "no-store",
    });
    const json = (await res.json()) as ApiResponse<unknown>;
    if (!json.success) {
      return {
        success: false,
        error: {
          code: json.error.code,
          message: json.error.message,
          details: (json.error.details as Record<string, string[]>) ?? undefined,
        },
      };
    }
    return { success: true };
  } catch {
    return {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message: "We couldn’t reach the server. Please try again.",
      },
    };
  }
}

export async function registerAction(
  _prev: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    password: formData.get("password"),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Please check the form",
        details: parsed.error.flatten().fieldErrors,
      },
    };
  }

  const input: RegisterInput = parsed.data;

  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      cache: "no-store",
    });
  } catch {
    return {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message: "Could not reach the server. Try again.",
      },
    };
  }

  const json = (await res.json()) as ApiResponse<{ user?: any; verificationRequired?: boolean; email?: string }>;

  if (!json.success) {
    return {
      success: false,
      error: {
        code: json.error.code,
        message: json.error.message,
        details: (json.error.details as Record<string, string[]>) ?? undefined,
      },
    };
  }

  return { success: true, verificationRequired: true, email: json.data.email ?? input.email };
}

export async function verifyEmailAction(
  _prev: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const parsed = verifyEmailSchema.safeParse({ email: formData.get("email"), code: formData.get("code") });
  if (!parsed.success) return { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Check the verification code.", details: parsed.error.flatten().fieldErrors } };
  try {
    const res = await fetch(`${API_URL}/auth/verify-email`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data), cache: "no-store" });
    const json = (await res.json()) as ApiResponse<unknown>;
    if (!json.success) return { success: false, error: { code: json.error.code, message: json.error.message } };
    await proxySetCookies(res);
    return { success: true };
  } catch {
    return { success: false, error: { code: "NETWORK_ERROR", message: "Could not reach the server. Try again." } };
  }
}

export async function resendVerificationAction(
  _prev: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { success: false, error: { code: "VALIDATION_ERROR", message: "Enter a valid email address." } };
  return sendAuthForm("resend-verification", parsed.data);
}

export async function logoutAction() {
  const store = await cookies();

  try {
    const logoutResponse = await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: { Cookie: store.toString() },
      cache: "no-store",
    });

    if (logoutResponse.status === 401 && store.get("refresh_token")?.value) {
      const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { Cookie: store.toString() },
        cache: "no-store",
      });
      if (refreshResponse.ok) {
        await proxySetCookies(refreshResponse);
        await fetch(`${API_URL}/auth/logout`, {
          method: "POST",
          headers: { Cookie: store.toString() },
          cache: "no-store",
        });
      }
    }
  } catch {
    /* ignore — we still clear locally */
  }

  // Clear both cookies on the Next side
  store.delete("access_token");
  store.delete("refresh_token");
  store.set("refresh_token", "", {
    path: "/api/v1/auth",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
  });

  redirect("/");
}
