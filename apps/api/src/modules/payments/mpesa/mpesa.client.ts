import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

interface StkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export class MpesaApiError extends Error {
  constructor(readonly errorCode: string, message: string) {
    super(message);
    this.name = "MpesaApiError";
  }
}

const INVALID_MPESA_PHONE_MESSAGE = "Enter an active Kenyan M-Pesa number in the format 07XXXXXXXX, 01XXXXXXXX, or 2547XXXXXXXX.";

function normalizeMpesaPhoneNumber(input: string): string {
  const cleaned = input.trim().replace(/[^\d+]/g, "");
  const normalized = cleaned.startsWith("+254") ? cleaned.slice(1)
    : cleaned.startsWith("0") ? `254${cleaned.slice(1)}`
    : cleaned.startsWith("254") ? cleaned
    : /^[17]\d{8}$/.test(cleaned) ? `254${cleaned}`
    : cleaned;
  if (!/^254[17]\d{8}$/.test(normalized)) throw new MpesaApiError("MPESA_INVALID_PHONE", INVALID_MPESA_PHONE_MESSAGE);
  return normalized;
}

interface StkPushPayload {
  BusinessShortCode: string;
  Password: string;
  Timestamp: string;
  TransactionType: "CustomerPayBillOnline" | "CustomerBuyGoodsOnline";
  Amount: number;
  PartyA: string;
  PartyB: string;
  PhoneNumber: string;
  CallBackURL: string;
  AccountReference: string;
  TransactionDesc: string;
}

@Injectable()
export class MpesaClient {
  private readonly logger = new Logger(MpesaClient.name);
  private readonly baseUrl: string;
  private readonly consumerKey: string;
  private readonly consumerSecret: string;
  private readonly shortcode: string;
  private readonly passkey: string;
  private readonly callbackUrl: string;

  private cachedToken: { value: string; expiresAt: number } | null = null;

  constructor(private readonly config: ConfigService) {
    const env = this.config.get<string>("mpesa.env") ?? "sandbox";
    this.baseUrl =
      env === "production"
        ? "https://api.safaricom.co.ke"
        : "https://sandbox.safaricom.co.ke";

    this.consumerKey = this.config.get<string>("mpesa.consumerKey") ?? "";
    this.consumerSecret = this.config.get<string>("mpesa.consumerSecret") ?? "";
    this.shortcode = this.config.get<string>("mpesa.shortcode") ?? "";
    this.passkey = this.config.get<string>("mpesa.passkey") ?? "";
    this.callbackUrl = this.config.get<string>("mpesa.callbackUrl") ?? "";

    if (!this.consumerKey || !this.consumerSecret) {
      this.logger.warn(
        "⚠️  M-Pesa credentials not configured. Payment endpoints will fail."
      );
    }
  }

private async getAccessToken(): Promise<string> {
  if (this.cachedToken && this.cachedToken.expiresAt > Date.now()) {
    return this.cachedToken.value;
  }

  const auth = Buffer.from(
    `${this.consumerKey}:${this.consumerSecret}`
  ).toString("base64");

  const url = `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Basic ${auth}` },
    });
  } catch (err) {
    this.logger.error(`Network error: ${(err as Error).message}`);
    throw err;
  }

  this.logger.log(`OAuth response status: ${res.status}`);

  if (!res.ok) {
    this.logger.error(`M-Pesa OAuth failed with HTTP ${res.status}`);
    throw new Error(`M-Pesa authentication failed (HTTP ${res.status})`);
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: string;
  };

  this.logger.log(`OAuth success — token cached`);

  this.cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (parseInt(data.expires_in, 10) - 60) * 1000,
  };
  return data.access_token;
}

  private buildPassword(timestamp: string): string {
    return Buffer.from(
      `${this.shortcode}${this.passkey}${timestamp}`
    ).toString("base64");
  }

  private buildTimestamp(): string {
    const now = new Date();
    const eat = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    return (
      eat.getUTCFullYear().toString() +
      pad(eat.getUTCMonth() + 1) +
      pad(eat.getUTCDate()) +
      pad(eat.getUTCHours()) +
      pad(eat.getUTCMinutes()) +
      pad(eat.getUTCSeconds())
    );
  }

  async stkPush(params: {
    phone: string;
    amount: number;
    accountReference: string;
    description: string;
    transactionType?: "CustomerPayBillOnline" | "CustomerBuyGoodsOnline";
  }): Promise<StkPushResponse> {
    const phone = normalizeMpesaPhoneNumber(params.phone);
    const token = await this.getAccessToken();
    const timestamp = this.buildTimestamp();
    const password = this.buildPassword(timestamp);

    const payload: StkPushPayload = {
      BusinessShortCode: this.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: params.transactionType ?? "CustomerPayBillOnline",
      Amount: params.amount,
      PartyA: phone,
      PartyB: this.shortcode,
      PhoneNumber: phone,
      CallBackURL: this.callbackUrl,
      AccountReference: params.accountReference,
      TransactionDesc: params.description,
    };

    const res = await fetch(
      `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = (await res.json()) as StkPushResponse & { errorCode?: string; errorMessage?: string };

    if (!res.ok || data.ResponseCode !== "0") {
      this.logger.error(`STK Push rejected: ${JSON.stringify(data)}`);
      const code = data.errorCode ?? data.ResponseCode ?? "MPESA_STK_REJECTED";
      if (code === "400.002.02") throw new MpesaApiError("MPESA_INVALID_PHONE", INVALID_MPESA_PHONE_MESSAGE);
      throw new MpesaApiError(code, "Safaricom could not send the M-Pesa prompt. Check the number and try again.");
    }

    return data;
  }
}
