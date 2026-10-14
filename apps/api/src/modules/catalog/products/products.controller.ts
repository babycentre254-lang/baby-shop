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
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

import { ProductsService } from "./products.service";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import { ObjectIdPipe } from "../../../common/pipes/object-id.pipe";
import { Public } from "../../../common/decorators/public.decorator";
import { Roles } from "../../../common/decorators/roles.decorator";
import { Permissions } from "../../../common/decorators/permissions.decorator";
import {
  createProductSchema,
  updateProductSchema,
  listProductsQuerySchema,
  addProductImagesSchema,
  ROLES,
  type CreateProductInput,
  type UpdateProductInput,
  type ListProductsQuery,
  type AddProductImagesInput,
} from "@baby-shop/shared";

@ApiTags("products")
@Controller("products")
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "List published products (public)" })
  list(
    @Query(new ZodValidationPipe(listProductsQuerySchema))
    query: ListProductsQuery
  ) {
    return this.products.list(query, { isAdmin: false });
  }

  @Public()
  @Get(":slugOrId")
  @ApiOperation({ summary: "Get a published product by slug or id (public)" })
  async getOne(@Param("slugOrId") slugOrId: string) {
    const product = await this.products.findBySlugOrId(slugOrId, {
      includeUnpublished: false,
    });
    return { product };
  }

  @Roles(ROLES.ADMIN, ROLES.SUPER_ADMIN)
  @Permissions("products.manage")
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a product (admin)" })
  async create(
    @Body(new ZodValidationPipe(createProductSchema)) dto: CreateProductInput
  ) {
    const product = await this.products.create(dto);
    return { product };
  }

  @Roles(ROLES.ADMIN, ROLES.SUPER_ADMIN)
  @Permissions("products.manage")
  @Patch(":id")
  async update(
    @Param("id", ObjectIdPipe) id: string,
    @Body(new ZodValidationPipe(updateProductSchema)) dto: UpdateProductInput
  ) {
    const product = await this.products.update(id, dto);
    return { product };
  }

  @Roles(ROLES.ADMIN, ROLES.SUPER_ADMIN)
  @Permissions("products.manage")
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id", ObjectIdPipe) id: string) {
    await this.products.remove(id);
  }

  @Roles(ROLES.ADMIN, ROLES.SUPER_ADMIN)
  @Permissions("products.manage")
  @Post(":id/images")
  async addImages(
    @Param("id", ObjectIdPipe) id: string,
    @Body(new ZodValidationPipe(addProductImagesSchema))
    dto: AddProductImagesInput
  ) {
    const product = await this.products.addImages(id, dto);
    return { product };
  }

  @Roles(ROLES.ADMIN, ROLES.SUPER_ADMIN)
  @Permissions("products.manage")
  @Delete(":id/images/:imageId")
  async removeImage(
    @Param("id", ObjectIdPipe) id: string,
    @Param("imageId", ObjectIdPipe) imageId: string
  ) {
    const product = await this.products.removeImage(id, imageId);
    return { product };
  }
}
