import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Response, CookieOptions } from "express";
import { TokenService } from "./token.service";

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";

@Injectable()
export class CookieService {
  private readonly base: CookieOptions;

  constructor(
    private readonly config: ConfigService,
    private readonly tokens: TokenService
  ) {
    this.base = {
      httpOnly: true,
      secure: this.config.get<boolean>("cookie.secure") ?? false,
      sameSite: this.config.get<"lax" | "strict" | "none">("cookie.sameSite") ?? "lax",
      domain:
        this.config.get<string>("cookie.domain") === "localhost"
          ? undefined
          : this.config.get<string>("cookie.domain"),
      path: "/",
    };
  }

  setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
    rememberMe = true
  ) {
    res.cookie(ACCESS_COOKIE, accessToken, {
      ...this.base,
      maxAge: this.tokens.getAccessCookieMaxAge(),
    });
    res.cookie(REFRESH_COOKIE, refreshToken, {
      ...this.base,
      ...(rememberMe ? { maxAge: this.tokens.getRefreshCookieMaxAge() } : {}),
      path: "/", // the storefront BFF proxy must receive refresh cookies too
    });
  }

  clearAuthCookies(res: Response) {
    res.clearCookie(ACCESS_COOKIE, { ...this.base, path: "/" });
    res.clearCookie(REFRESH_COOKIE, { ...this.base, path: "/" });
  }
}
