import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer, { type Transporter } from "nodemailer";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;

  constructor(config: ConfigService) {
    const host = config.get<string>("mail.host", "");
    const user = config.get<string>("mail.user", "");
    const pass = config.get<string>("mail.pass", "");
    const port = config.get<number>("mail.port", 587);
    const fromEmail = config.get<string>("mail.fromEmail", "");
    const fromName = config.get<string>("mail.fromName", "BabyCentre Baby Shop");

    this.transporter = host && user && pass
      ? nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user, pass },
          connectionTimeout: 10_000,
          greetingTimeout: 10_000,
          socketTimeout: 20_000,
        })
      : null;
    this.from = `"${fromName.replaceAll('"', "")}" <${fromEmail || user}>`;
  }

  async sendPasswordResetCode(input: {
    to: string;
    firstName: string;
    code: string;
  }): Promise<void> {
    const safeName = this.escapeHtml(input.firstName);
    await this.send({
      to: input.to,
      subject: `${input.code} is your BabyCentre password reset code`,
      text: `Hi ${input.firstName}, your password reset code is ${input.code}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
      html: this.emailFrame(
        "Reset your password",
        `<p style="margin:0 0 20px;color:#4a5461">Hi ${safeName}, use this code to choose a new password. It expires in <strong>10 minutes</strong>.</p><div style="letter-spacing:12px;text-align:center;font-size:30px;font-weight:700;color:#0075b0;background:#e6f6fd;border-radius:16px;padding:22px 14px">${input.code}</div><p style="margin:20px 0 0;color:#6e7885;font-size:13px">If you didn’t request a reset, you can safely ignore this email.</p>`
      ),
    });
  }

  async sendEmailVerificationCode(input: { to: string; firstName: string; code: string }): Promise<void> {
    const safeName = this.escapeHtml(input.firstName);
    await this.send({
      to: input.to,
      subject: `${input.code} is your BabyCentre verification code`,
      text: `Hi ${input.firstName}, your email verification code is ${input.code}. It expires in 10 minutes.`,
      html: this.emailFrame(
        "Verify your email",
        `<p style="margin:0 0 20px;color:#4a5461">Hi ${safeName}, enter this code to finish creating your BabyCentre account. It expires in <strong>10 minutes</strong>.</p><div style="letter-spacing:12px;text-align:center;font-size:30px;font-weight:700;color:#0075b0;background:#e6f6fd;border-radius:16px;padding:22px 14px">${input.code}</div><p style="margin:20px 0 0;color:#6e7885;font-size:13px">If you didn’t create an account, you can ignore this email.</p>`
      ),
    });
  }

  async sendWelcome(input: { to: string; firstName: string }): Promise<void> {
    const safeName = this.escapeHtml(input.firstName);
    await this.send({
      to: input.to,
      subject: "Welcome to BabyCentre Baby Shop",
      text: `Hi ${input.firstName}, welcome to BabyCentre. Your account is ready for thoughtful finds for your little one.`,
      html: this.emailFrame(
        "Welcome to BabyCentre",
        `<p style="margin:0 0 16px;color:#4a5461">Hi ${safeName}, we’re so glad you’re here.</p><p style="margin:0;color:#4a5461">Your account is ready. Discover gentle essentials, thoughtful toys, and everyday favourites for your little one.</p>`
      ),
    });
  }

  private async send(message: {
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<void> {
    if (!this.transporter || !this.from.includes("<")) {
      throw new ServiceUnavailableException("Email delivery is not configured");
    }

    try {
      await this.transporter.sendMail({ from: this.from, ...message });
    } catch (error) {
      this.logger.error(
        `Transactional email delivery failed: ${error instanceof Error ? error.message : "unknown SMTP error"}`
      );
      throw new ServiceUnavailableException("Email could not be sent");
    }
  }

  private emailFrame(title: string, content: string): string {
    return `<!doctype html><html><body style="margin:0;background:#fff7ec;font-family:Arial,sans-serif;color:#151a22;padding:32px 16px"><table role="presentation" style="width:100%;max-width:560px;margin:auto;background:#fff;border:1px solid #f5e1c1;border-radius:22px"><tr><td style="padding:32px"><div style="font-size:13px;font-weight:700;letter-spacing:1px;color:#0075b0">BABYCENTRE BABY SHOP</div><h1 style="margin:20px 0 18px;font-size:24px;color:#151a22">${title}</h1>${content}<hr style="border:0;border-top:1px solid #ebeff2;margin:28px 0 16px"><p style="margin:0;color:#6e7885;font-size:12px">Little Needs, Big Smiles · BabyCentre Baby Shop</p></td></tr></table></body></html>`;
  }

  private escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!
    );
  }
}
