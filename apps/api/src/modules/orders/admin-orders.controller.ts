import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { OrdersService } from "./orders.service";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { ObjectIdPipe } from "../../common/pipes/object-id.pipe";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import {
  listOrdersQuerySchema,
  updateOrderStatusSchema,
  ROLES,
  type ListOrdersQuery,
  type UpdateOrderStatusInput,
} from "@baby-shop/shared";

@ApiTags("admin/orders")
@Controller("admin/orders")
@Roles(ROLES.ADMIN, ROLES.SUPER_ADMIN)
export class AdminOrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  @Permissions("orders.view")
  @ApiOperation({ summary: "List all orders (admin)" })
  listAll(
    @Query(new ZodValidationPipe(listOrdersQuerySchema))
    query: ListOrdersQuery
  ) {
    return this.orders.listAll(query);
  }

  @Get("checkout-sessions")
  @Permissions("checkouts.view")
  @ApiOperation({ summary: "List unfinished and expired checkout sessions" })
  listCheckoutSessions() {
    return this.orders.listCheckoutSessionsForAdmin();
  }

  @Get(":id")
  @Permissions("orders.view")
  @ApiOperation({ summary: "Get one order (admin)" })
  async getOne(@Param("id", ObjectIdPipe) id: string) {
    const order = await this.orders["repo"].findById(id);
    if (!order) {
      throw new NotFoundException({
        code: "ORDER_NOT_FOUND",
        message: "Order not found",
      });
    }
    return { order };
  }

  @Patch(":id/status")
  @Permissions("orders.manage")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update order status (admin)" })
  async updateStatus(
    @CurrentUser("sub") userId: string,
    @Param("id", ObjectIdPipe) id: string,
    @Body(new ZodValidationPipe(updateOrderStatusSchema))
    dto: UpdateOrderStatusInput
  ) {
    const order = await this.orders.updateStatus(id, dto, userId);
    return { order };
  }
}
