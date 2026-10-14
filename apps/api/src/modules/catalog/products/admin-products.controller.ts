import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { ProductsService } from "./products.service";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import { ObjectIdPipe } from "../../../common/pipes/object-id.pipe";
import { Permissions } from "../../../common/decorators/permissions.decorator";
import { z } from "zod";

const inventoryUpdateSchema = z.object({
  variants: z.array(z.object({
    variantId: z.string().regex(/^[a-f\d]{24}$/i),
    stock: z.number().int().min(0).max(1_000_000),
  })).min(1).max(500),
}).refine((value) => new Set(value.variants.map(({ variantId }) => variantId)).size === value.variants.length, "Each variant can only be updated once");
import { Roles } from "../../../common/decorators/roles.decorator";
import {
  listProductsQuerySchema,
  ROLES,
  type ListProductsQuery,
} from "@baby-shop/shared";

@ApiTags("admin/products")
@Controller("admin/products")
@Roles(ROLES.ADMIN, ROLES.SUPER_ADMIN)
export class AdminProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @Permissions("products.view", "inventory.view")
  @ApiOperation({
    summary: "List all products including drafts (admin)",
  })
  list(
    @Query(new ZodValidationPipe(listProductsQuerySchema))
    query: ListProductsQuery
  ) {
    return this.products.list(query, { isAdmin: true });
  }

  @Get(":id")
  @Permissions("products.view")
  @ApiOperation({ summary: "Get any product by id, including drafts (admin)" })
  async getOne(@Param("id", ObjectIdPipe) id: string) {
    const product = await this.products.findBySlugOrId(id, {
      includeUnpublished: true,
    });
    return { product };
  }

  @Patch(":id/inventory")
  @Permissions("inventory.manage")
  async updateInventory(
    @Param("id", ObjectIdPipe) id: string,
    @Body(new ZodValidationPipe(inventoryUpdateSchema)) body: { variants: { variantId: string; stock: number }[] }
  ) {
    const product = await this.products.updateInventory(id, body.variants);
    return { product };
  }
}
