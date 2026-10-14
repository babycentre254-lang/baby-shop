export interface AppConfig {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  corsOrigins: string[];
  mongodbUri: string;
  redis: { host: string; port: number };
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessExpiresIn: string;
    refreshExpiresIn: string;
  };
  cookie: {
    domain: string;
    secure: boolean;
    sameSite: "lax" | "strict" | "none";
  };
  mpesa: {
    env: string;
    consumerKey: string;
    consumerSecret: string;
    shortcode: string;
    passkey: string;
    callbackUrl: string;
  };
  mail: {
    host: string;
    port: number;
    user: string;
    pass: string;
    fromEmail: string;
    fromName: string;
  };
}

export default (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseInt(process.env.PORT ?? "4000", 10),
  apiPrefix: process.env.API_PREFIX ?? "api/v1",
  corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
  mongodbUri: process.env.MONGODB_URI!,
  redis: {
    host: process.env.REDIS_HOST ?? "localhost",
    port: parseInt(process.env.REDIS_PORT ?? "6379", 10),
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
  },
  cookie: {
    domain: process.env.COOKIE_DOMAIN ?? "localhost",
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: (process.env.COOKIE_SAMESITE as "lax" | "strict" | "none") ?? "lax",
  },
  mpesa: {
    env: process.env.MPESA_ENV ?? "sandbox",
    consumerKey: process.env.MPESA_CONSUMER_KEY ?? "",
    consumerSecret: process.env.MPESA_CONSUMER_SECRET ?? "",
    shortcode: process.env.MPESA_SHORTCODE ?? "",
    passkey: process.env.MPESA_PASSKEY ?? "",
    callbackUrl: process.env.MPESA_CALLBACK_URL ?? "",
  },
  mail: {
    host: process.env.SMTP_HOST ?? "",
    port: parseInt(process.env.SMTP_PORT ?? "587", 10),
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
    fromEmail: process.env.MAIL_FROM_EMAIL ?? process.env.SMTP_USER ?? "",
    fromName: process.env.MAIL_FROM_NAME ?? "BabyCentre Baby Shop",
  },
});
