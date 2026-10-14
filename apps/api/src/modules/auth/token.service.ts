import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SignJWT, jwtVerify, JWTPayload } from "jose";

export interface AccessTokenPayload extends JWTPayload {
  sub: string;
  email: string;
  role: string;
  type: "access";
}

export interface RefreshTokenPayload extends JWTPayload {
  sub: string;
  ver: number;
  rememberMe: boolean;
  type: "refresh";
}

@Injectable()
export class TokenService {
  private readonly accessSecret: Uint8Array;
  private readonly refreshSecret: Uint8Array;
  private readonly accessExpiresIn: string;
  private readonly refreshExpiresIn: string;

  constructor(private readonly config: ConfigService) {
    this.accessSecret = new TextEncoder().encode(
      this.config.getOrThrow<string>("jwt.accessSecret")
    );
    this.refreshSecret = new TextEncoder().encode(
      this.config.getOrThrow<string>("jwt.refreshSecret")
    );
    this.accessExpiresIn = this.config.getOrThrow<string>("jwt.accessExpiresIn");
    this.refreshExpiresIn = this.config.getOrThrow<string>(
      "jwt.refreshExpiresIn"
    );
  }

  async signAccessToken(payload: {
    sub: string;
    email: string;
    role: string;
  }): Promise<string> {
    return new SignJWT({ ...payload, type: "access" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setIssuer("baby-shop-api")
      .setAudience("baby-shop-web")
      .setExpirationTime(this.accessExpiresIn)
      .sign(this.accessSecret);
  }

  async signRefreshToken(payload: {
    sub: string;
    ver: number;
    rememberMe: boolean;
  }): Promise<string> {
    return new SignJWT({
      sub: payload.sub,
      ver: payload.ver,
      rememberMe: payload.rememberMe,
      type: "refresh",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setIssuer("baby-shop-api")
      .setAudience("baby-shop-web")
      .setExpirationTime(this.refreshExpiresIn)
      .sign(this.refreshSecret);
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    try {
      const { payload } = await jwtVerify(token, this.accessSecret, {
        issuer: "baby-shop-api",
        audience: "baby-shop-web",
      });
      if (payload.type !== "access") throw new Error("Wrong token type");
      return payload as AccessTokenPayload;
    } catch {
      throw new UnauthorizedException({
        code: "INVALID_ACCESS_TOKEN",
        message: "Access token is invalid or expired",
      });
    }
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      const { payload } = await jwtVerify(token, this.refreshSecret, {
        issuer: "baby-shop-api",
        audience: "baby-shop-web",
      });
      if (payload.type !== "refresh") throw new Error("Wrong token type");
      return payload as RefreshTokenPayload;
    } catch {
      throw new UnauthorizedException({
        code: "INVALID_REFRESH_TOKEN",
        message: "Refresh token is invalid or expired",
      });
    }
  }

  /** Convert "15m" / "7d" / "3600" into milliseconds */
  parseDurationMs(duration: string): number {
    const match = /^(\d+)([smhd])?$/.exec(duration.trim());
    if (!match) return 15 * 60 * 1000;
    const value = parseInt(match[1], 10);
    const unit = match[2] ?? "s";
    const map: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return value * (map[unit] ?? 1000);
  }

  getAccessCookieMaxAge(): number {
    return this.parseDurationMs(this.accessExpiresIn);
  }

  getRefreshCookieMaxAge(): number {
    return this.parseDurationMs(this.refreshExpiresIn);
  }
}
