import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { Types } from "mongoose";

import { PaymentsRepository } from "./payments.repository";
import { MpesaClient } from "./mpesa/mpesa.client";
import { OrdersRepository } from "../orders/orders.repository";
import { OrdersService } from "../orders/orders.service";
import { PaymentDocument } from "./schemas/payment.schema";



import {
  ORDER_STATUS,
  PAYMENT_PROVIDER,
  PAYMENT_STATUS,
  type InitiateMpesaPaymentInput,
  type MpesaCallbackPayload,
} from "@baby-shop/shared";
import { lookupResultCode } from "./mpesa/mpesa-result-codes";
import { MpesaApiError } from "./mpesa/mpesa.client";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly repo: PaymentsRepository,
    private readonly mpesa: MpesaClient,
    private readonly orders: OrdersRepository,
    private readonly checkout: OrdersService
  ) {}

  async initiateMpesa(
    userId: string,
    input: InitiateMpesaPaymentInput
  ): Promise<PaymentDocument> {
    if (input.orderId) return this.initiateLegacyMpesa(userId, input.orderId, input.phone);
    if (!input.sessionId) {
      throw new BadRequestException({ code: "CHECKOUT_SESSION_REQUIRED", message: "A checkout session is required to start payment." });
    }
    const session = await this.checkout.getCheckoutSession(userId, input.sessionId);
    if (session.paymentProvider !== PAYMENT_PROVIDER.MPESA) {
      throw new BadRequestException({ code: "PAYMENT_PROVIDER_MISMATCH", message: "This checkout was not set up for M-Pesa." });
    }

    const existingPending = await this.repo.findPendingBySession(session._id.toString());
    if (existingPending) {
      throw new BadRequestException({
        code: "PAYMENT_ALREADY_PENDING",
        message: "A payment for this order is already in progress",
        details: { checkoutRequestId: existingPending.checkoutRequestId },
      });
    }

    await this.checkout.setCheckoutSessionPaymentPending(session._id.toString());
    let payment: PaymentDocument;
    try {
      payment = await this.repo.create({
        checkoutSessionId: session._id,
        userId: new Types.ObjectId(userId),
        provider: PAYMENT_PROVIDER.MPESA,
        status: PAYMENT_STATUS.PENDING,
        amount: session.total,
        phone: input.phone,
      });
    } catch (error) {
      await this.checkout.setCheckoutSessionPaymentFailed(session._id.toString());
      throw error;
    }

    // Call M-Pesa
    let stkResponse;
    try {
      stkResponse = await this.mpesa.stkPush({
        phone: input.phone,
        amount: Math.round(session.total),
        accountReference: `BS${session._id.toString().slice(-8)}`,
        description: "Baby Shop checkout",
      });
    } catch (err) {
      this.logger.error(`STK Push failed: ${(err as Error).message}`);
      await this.repo.markFailedIfPending(payment._id.toString(), { resultDesc: (err as Error).message, userMessage: "Could not send the M-Pesa prompt. Please try again." });
      await this.checkout.setCheckoutSessionPaymentFailed(session._id.toString());
      throw new BadRequestException({
        code: "MPESA_STK_FAILED",
        message: "Could not initiate M-Pesa payment. Please try again.",
      });
    }

    payment = (await this.repo.updateById(payment._id.toString(), {
      merchantRequestId: stkResponse.MerchantRequestID,
      checkoutRequestId: stkResponse.CheckoutRequestID,
      providerResponse: stkResponse as unknown as Record<string, unknown>,
    }))!;
    return payment;
  }

  async initiateAdminPosMpesa(actorId: string, orderId: string, phone: string) {
    const order = await this.orders.findById(orderId);
    if (!order || (order as any).salesChannel !== "POS" || order.paymentProvider !== PAYMENT_PROVIDER.MPESA) throw new NotFoundException({ code: "POS_SALE_NOT_FOUND", message: "M-Pesa sale not found." });
    if (order.status !== ORDER_STATUS.PENDING) throw new BadRequestException({ code: "POS_SALE_NOT_PAYABLE", message: "This sale is no longer awaiting payment." });
    if (await this.repo.findPendingByOrder(orderId)) throw new BadRequestException({ code: "PAYMENT_ALREADY_PENDING", message: "An M-Pesa prompt is already in progress." });
    let response;
    try {
      response = await this.mpesa.stkPush({ phone, amount: Math.round(order.total), accountReference: order.orderNumber, description: `In-store sale ${order.orderNumber}` });
    } catch (error) {
      this.logger.error(`POS STK Push failed: ${(error as Error).message}`);
      if (error instanceof MpesaApiError && error.errorCode === "MPESA_INVALID_PHONE") throw new BadRequestException({ code: "MPESA_INVALID_PHONE", message: error.message });
      throw new BadRequestException({ code: "MPESA_STK_FAILED", message: "Could not send the M-Pesa prompt. Please try again." });
    }
    return this.repo.create({ orderId: order._id, userId: new Types.ObjectId(actorId), provider: PAYMENT_PROVIDER.MPESA, status: PAYMENT_STATUS.PENDING, amount: order.total, phone, merchantRequestId: response.MerchantRequestID, checkoutRequestId: response.CheckoutRequestID, providerResponse: response as unknown as Record<string, unknown> });
  }

  private async initiateLegacyMpesa(userId: string, orderId: string, phone: string) {
    const order = await this.orders.findById(orderId);
    if (!order) throw new NotFoundException({ code: "ORDER_NOT_FOUND", message: "Order not found" });
    if (order.userId.toString() !== userId) throw new ForbiddenException({ code: "NOT_YOUR_ORDER", message: "This order does not belong to you" });
    if (order.status !== ORDER_STATUS.PENDING) throw new BadRequestException({ code: "ORDER_NOT_PENDING", message: `Order is already "${order.status}"` });
    if (await this.repo.findPendingByOrder(orderId)) throw new BadRequestException({ code: "PAYMENT_ALREADY_PENDING", message: "A payment for this order is already in progress" });
    let response;
    try {
      response = await this.mpesa.stkPush({ phone, amount: Math.round(order.total), accountReference: order.orderNumber, description: `Payment for ${order.orderNumber}` });
    } catch (error) {
      this.logger.error(`Legacy STK Push failed: ${(error as Error).message}`);
      throw new BadRequestException({ code: "MPESA_STK_FAILED", message: "Could not initiate M-Pesa payment. Please try again." });
    }
    return this.repo.create({ orderId: order._id, userId: new Types.ObjectId(userId), provider: PAYMENT_PROVIDER.MPESA, status: PAYMENT_STATUS.PENDING, amount: order.total, phone, merchantRequestId: response.MerchantRequestID, checkoutRequestId: response.CheckoutRequestID, providerResponse: response as unknown as Record<string, unknown> });
  }

  /**
   * Handle the async callback from Safaricom.
   * MUST be idempotent — Safaricom retries on failure.
   */
async handleMpesaCallback(payload: MpesaCallbackPayload): Promise<void> {
  const stk = payload.Body.stkCallback;

  this.logger.log(
    `Callback received: CheckoutRequestID=${stk.CheckoutRequestID} ResultCode=${stk.ResultCode}`
  );

  const payment = await this.repo.findByCheckoutRequestId(stk.CheckoutRequestID);

  if (!payment) {
    this.logger.warn(
      `Unknown CheckoutRequestID in callback: ${stk.CheckoutRequestID}`
    );
    return;
  }

  if (payment.status !== PAYMENT_STATUS.PENDING && payment.status !== PAYMENT_STATUS.SUCCESS) {
    this.logger.log(
      `Payment ${payment._id} already ${payment.status}, ignoring duplicate callback`
    );
    return;
  }

  const info = lookupResultCode(stk.ResultCode);

  if (info.success) {
    // ─── SUCCESS ───
    const items = stk.CallbackMetadata?.Item ?? [];
    const receipt = items.find(
      (i: { Name: string; Value?: string | number }) =>
        i.Name === "MpesaReceiptNumber"
    )?.Value;

    await this.repo.markSuccessIfPending(
      payment._id.toString(),
      {
        mpesaReceiptNumber: receipt ? String(receipt) : undefined,
        resultCode: stk.ResultCode,
        resultDesc: stk.ResultDesc,
        resultLabel: info.label,
        retryable: false,
        userMessage: info.userMessage,
      }
    );

    if (payment.checkoutSessionId) {
      // The callback may be retried after marking the payment successful but
      // before order creation completed. Order creation is idempotent per session.
      try {
        const order = await this.checkout.createOrderFromCheckoutSession(
          payment.checkoutSessionId.toString(), ORDER_STATUS.PAID
        );
        await this.repo.updateById(payment._id.toString(), { orderId: order._id });
        this.logger.log(`Payment ${payment._id} confirmed — order ${order.orderNumber} created`);
      } catch (error) {
        this.logger.error(
          `Payment ${payment._id} succeeded but order materialization needs retry/review: ${(error as Error).message}`
        );
        throw error;
      }
    } else if (payment.status === PAYMENT_STATUS.PENDING && payment.orderId) {
      // Compatibility for payment attempts created before checkout sessions.
      const paidOrder = await this.orders.findById(payment.orderId.toString());
      const nextStatus = (paidOrder as any)?.salesChannel === "POS" ? ORDER_STATUS.DELIVERED : ORDER_STATUS.PAID;
      await this.orders.updateById(payment.orderId.toString(), {
        status: nextStatus,
        $push: {
          statusHistory: {
            status: nextStatus,
            note: `M-Pesa payment received (${receipt ?? "no receipt"})`,
            at: new Date(),
          },
        },
      } as any);

      this.logger.log(
        `Payment ${payment._id} SUCCESS — order ${payment.orderId} marked ${nextStatus}`
      );
    }
  } else {
    // ─── FAILURE ───
    await this.repo.markFailedIfPending(payment._id.toString(), {
      resultCode: stk.ResultCode,
      resultDesc: stk.ResultDesc,
      resultLabel: info.label,
      retryable: info.retryable,
      userMessage: info.userMessage,
    });
    if (payment.checkoutSessionId) await this.checkout.setCheckoutSessionPaymentFailed(payment.checkoutSessionId.toString());
    else if (payment.orderId) await this.checkout.cancelUnpaidPosSale(payment.orderId.toString(), `M-Pesa payment failed: ${info.label}`);

    this.logger.warn(
      `Payment ${payment._id} FAILED [${info.label}] code=${stk.ResultCode}: ${info.userMessage}`
    );
  }
}

async getPaymentStatus(userId: string, orderId: string) {
  const order = await this.orders.findById(orderId);
  if (!order) {
    throw new NotFoundException({
      code: "ORDER_NOT_FOUND",
      message: "Order not found",
    });
  }
  if (order.userId.toString() !== userId) {
    throw new ForbiddenException({
      code: "NOT_YOUR_ORDER",
      message: "This order does not belong to you",
    });
  }

  // Latest payment for the order
  const payment = await this.repo["model"]
    .findOne({ orderId: new Types.ObjectId(orderId) })
    .sort({ createdAt: -1 })
    .exec();

  return {
    order: {
      _id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.total,
    },
    payment: payment
      ? {
          _id: payment._id,
          status: payment.status,
          amount: payment.amount,
          phone: payment.phone,
          mpesaReceiptNumber: payment.mpesaReceiptNumber,
          resultCode: payment.resultCode,
          resultDesc: payment.resultDesc,
          resultLabel: (payment as any).resultLabel,
          retryable: (payment as any).retryable ?? false,
          userMessage: (payment as any).userMessage,
        }
      : null,
  };
}

async getCheckoutSessionPaymentStatus(userId: string, sessionId: string) {
  let status;
  try {
    status = await this.checkout.getCheckoutSessionStatus(userId, sessionId);
  } catch (error) {
    if (!(error instanceof NotFoundException)) throw error;
    const legacy = await this.getPaymentStatus(userId, sessionId);
    status = {
      session: { _id: sessionId, status: legacy.order.status === ORDER_STATUS.PAID ? "COMPLETED" : legacy.order.status === ORDER_STATUS.CANCELLED ? "CANCELLED" : "AWAITING_PAYMENT", paymentProvider: "MPESA", total: legacy.order.total, expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(), legacy: true },
      order: legacy.order,
    };
    return { ...status, payment: legacy.payment };
  }
  const payment = await this.repo.findLatestBySession(sessionId);
  return {
    ...status,
    payment: payment ? {
      _id: payment._id,
      status: payment.status,
      amount: payment.amount,
      phone: payment.phone,
      mpesaReceiptNumber: payment.mpesaReceiptNumber,
      resultCode: payment.resultCode,
      resultDesc: payment.resultDesc,
      resultLabel: payment.resultLabel,
      retryable: payment.retryable ?? false,
      userMessage: payment.userMessage,
    } : null,
  };
}

  async listMine(userId: string) {
    // Placeholder for future: list payments for current user
    // Not needed for MVP but useful for support
  }
}

