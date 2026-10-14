import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Roles } from "../../common/decorators/roles.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ROLES } from "@baby-shop/shared";
import { z } from "zod";

import { PaymentsService } from "./payments.service";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { ObjectIdPipe } from "../../common/pipes/object-id.pipe";
import { Public } from "../../common/decorators/public.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import {
  initiateMpesaPaymentSchema,
  mpesaPhoneSchema,
  mpesaCallbackSchema,
  type InitiateMpesaPaymentInput,
  type MpesaCallbackPayload,
} from "@baby-shop/shared";

@ApiTags("payments")
@Controller("payments")
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Roles(ROLES.ADMIN, ROLES.SUPER_ADMIN)
  @Permissions("orders.manage")
  @Post("mpesa/pos/:orderId")
  @HttpCode(HttpStatus.CREATED)
  async initiatePosMpesa(@CurrentUser("sub") actorId: string, @Param("orderId", ObjectIdPipe) orderId: string, @Body(new ZodValidationPipe(z.object({ phone: mpesaPhoneSchema }))) body: { phone: string }) {
    const payment = await this.payments.initiateAdminPosMpesa(actorId, orderId, body.phone);
    return { payment: { _id: payment._id, status: payment.status, checkoutRequestId: payment.checkoutRequestId, amount: payment.amount, phone: payment.phone }, message: "M-Pesa prompt sent." };
  }

  // ═══════════════════════════════════════════════════════════
  // Initiate M-Pesa STK Push
  // ═══════════════════════════════════════════════════════════

  @Post("mpesa/stkpush")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Initiate M-Pesa STK Push for a checkout session" })
  async initiateMpesa(
    @CurrentUser("sub") userId: string,
    @Body(new ZodValidationPipe(initiateMpesaPaymentSchema))
    dto: InitiateMpesaPaymentInput
  ) {
    const payment = await this.payments.initiateMpesa(userId, dto);
    return {
      payment: {
        _id: payment._id,
        status: payment.status,
        checkoutRequestId: payment.checkoutRequestId,
        amount: payment.amount,
        phone: payment.phone,
      },
      message: "STK Push sent. Enter your M-Pesa PIN on your phone.",
    };
  }

  // ═══════════════════════════════════════════════════════════
  // Get payment status for an order (used for polling)
  // ═══════════════════════════════════════════════════════════

  @Get("order/:orderId/status")
  @ApiOperation({ summary: "Get the payment status for an order" })
  async getStatus(
    @CurrentUser("sub") userId: string,
    @Param("orderId", ObjectIdPipe) orderId: string
  ) {
    return this.payments.getPaymentStatus(userId, orderId);
  }

  @Get("checkout-session/:sessionId/status")
  @ApiOperation({ summary: "Get payment and order status for a checkout session" })
  async getCheckoutSessionStatus(
    @CurrentUser("sub") userId: string,
    @Param("sessionId", ObjectIdPipe) sessionId: string
  ) {
    return this.payments.getCheckoutSessionPaymentStatus(userId, sessionId);
  }

  // ═══════════════════════════════════════════════════════════
  // M-Pesa callback webhook (public — no auth)
  // ═══════════════════════════════════════════════════════════

  @Public()
  @Post("mpesa/callback")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "M-Pesa callback webhook (public)" })
  async mpesaCallback(
    @Body(new ZodValidationPipe(mpesaCallbackSchema))
    payload: MpesaCallbackPayload
  ) {
    // Fire-and-forget — Safaricom expects a fast 200 response.
    this.payments.handleMpesaCallback(payload).catch(() => {
      // Already logged inside the service
    });

    return { ResultCode: 0, ResultDesc: "Accepted" };
  }
}
