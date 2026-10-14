import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

import { CartService } from "./cart.service";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { ObjectIdPipe } from "../../common/pipes/object-id.pipe";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import {
  addToCartSchema,
  updateCartItemSchema,
  mergeCartSchema,
  type AddToCartInput,
  type UpdateCartItemInput,
  type MergeCartInput,
} from "@baby-shop/shared";

@ApiTags("cart")
@Controller("cart")
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  @ApiOperation({ summary: "Get my cart" })
  async getCart(@CurrentUser("sub") userId: string) {
    const cart = await this.cart.getCart(userId);
    return { cart };
  }

  @Post("items")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Add an item to my cart" })
  async addItem(
    @CurrentUser("sub") userId: string,
    @Body(new ZodValidationPipe(addToCartSchema)) dto: AddToCartInput
  ) {
    const cart = await this.cart.addItem(userId, dto);
    return { cart };
  }

  @Patch("items/:itemId")
  @ApiOperation({ summary: "Update the quantity of a cart item" })
  async updateItem(
    @CurrentUser("sub") userId: string,
    @Param("itemId", ObjectIdPipe) itemId: string,
    @Body(new ZodValidationPipe(updateCartItemSchema)) dto: UpdateCartItemInput
  ) {
    const cart = await this.cart.updateItem(userId, itemId, dto);
    return { cart };
  }

  @Delete("items/:itemId")
  @ApiOperation({ summary: "Remove a cart item" })
  async removeItem(
    @CurrentUser("sub") userId: string,
    @Param("itemId", ObjectIdPipe) itemId: string
  ) {
    const cart = await this.cart.removeItem(userId, itemId);
    return { cart };
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Clear my cart" })
  async clear(@CurrentUser("sub") userId: string) {
    await this.cart.clear(userId);
  }

  @Post("merge")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Merge guest cart items into user cart" })
  async merge(
    @CurrentUser("sub") userId: string,
    @Body(new ZodValidationPipe(mergeCartSchema)) dto: MergeCartInput
  ) {
    const cart = await this.cart.mergeItems(userId, dto.items);
    return { cart };
  }
}