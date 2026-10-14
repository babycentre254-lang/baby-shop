import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

import { OrdersService } from "./orders.service";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { ObjectIdPipe } from "../../common/pipes/object-id.pipe";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import {
  checkoutSchema,
  listOrdersQuerySchema,
  type CheckoutInput,
  type ListOrdersQuery,
} from "@baby-shop/shared";

@ApiTags("orders")
@Controller("orders")
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  // ─── Customer endpoints ────────────────────────────

  @Post("checkout")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Convert my cart to an order" })
  async checkout(
    @CurrentUser("sub") userId: string,
    @Body(new ZodValidationPipe(checkoutSchema)) dto: CheckoutInput
  ) {
    return this.orders.createCheckoutSession(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: "List my orders" })
  async listMine(
    @CurrentUser("sub") userId: string,
    @Query(new ZodValidationPipe(listOrdersQuerySchema))
    query: ListOrdersQuery
  ) {
    return this.orders.listMine(userId, query);
  }

  @Public()
  @Get("trending-products")
  @ApiOperation({ summary: "List top-selling published products from the last 90 days" })
  async listTrendingProducts() {
    const items = await this.orders.getTrendingProducts();
    return { items };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get one of my orders" })
  async getMine(
    @CurrentUser("sub") userId: string,
    @Param("id", ObjectIdPipe) id: string
  ) {
    const order = await this.orders.getMine(userId, id);
    return { order };
  }

  @Get("checkout-sessions/:id")
  @ApiOperation({ summary: "Get my checkout session" })
  async getCheckoutSession(
    @CurrentUser("sub") userId: string,
    @Param("id", ObjectIdPipe) id: string
  ) {
    const session = await this.orders.getCheckoutSession(userId, id);
    return { session };
  }

  @Post("checkout-sessions/:id/cancel")
  @ApiOperation({ summary: "Cancel an unpaid checkout session" })
  async cancelCheckoutSession(
    @CurrentUser("sub") userId: string,
    @Param("id", ObjectIdPipe) id: string
  ) {
    return this.orders.cancelCheckoutSession(userId, id);
  }

  @Post(":id/cancel")
  @ApiOperation({ summary: "Cancel one of my orders (if still cancellable)" })
  async cancel(
    @CurrentUser("sub") userId: string,
    @Param("id", ObjectIdPipe) id: string,
    @Body() body: { reason?: string }
  ) {
    const order = await this.orders.cancelMine(userId, id, body.reason);
    return { order };
  }
}

