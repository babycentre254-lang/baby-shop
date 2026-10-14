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

import { BrandsService } from "./brands.service";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import { ObjectIdPipe } from "../../../common/pipes/object-id.pipe";
import { Public } from "../../../common/decorators/public.decorator";
import { Roles } from "../../../common/decorators/roles.decorator";
import { Permissions } from "../../../common/decorators/permissions.decorator";
import {
  createBrandSchema,
  updateBrandSchema,
  listBrandsQuerySchema,
  ROLES,
  type CreateBrandInput,
  type UpdateBrandInput,
  type ListBrandsQuery,
} from "@baby-shop/shared";

@ApiTags("brands")
@Controller("brands")
export class BrandsController {
  constructor(private readonly brands: BrandsService) {}

  // ─── Admin routes (must come before :slugOrId) ───

  @Roles(ROLES.ADMIN, ROLES.SUPER_ADMIN)
  @Permissions("brands.view", "products.manage")
  @Get("admin/list")
  @ApiOperation({ summary: "List all brands including inactive (admin)" })
  listAdmin(
    @Query(new ZodValidationPipe(listBrandsQuerySchema))
    query: ListBrandsQuery
  ) {
    return this.brands.list(query, { includeInactive: true });
  }

  @Roles(ROLES.ADMIN, ROLES.SUPER_ADMIN)
  @Permissions("brands.view")
  @Get("admin/:id")
  @ApiOperation({ summary: "Get any brand by id, including inactive (admin)" })
  async getOneAdmin(@Param("id", ObjectIdPipe) id: string) {
    const doc = await this.brands.findBySlugOrId(id, {
      includeInactive: true,
    });
    return { brand: doc };
  }

  // ─── Public routes ───

  @Public()
  @Get()
  @ApiOperation({ summary: "List active brands (public)" })
  list(
    @Query(new ZodValidationPipe(listBrandsQuerySchema))
    query: ListBrandsQuery
  ) {
    return this.brands.list(query, { includeInactive: false });
  }

  @Public()
  @Get(":slugOrId")
  @ApiOperation({ summary: "Get brand by slug or id (public)" })
  async getOne(@Param("slugOrId") slugOrId: string) {
    const doc = await this.brands.findBySlugOrId(slugOrId, {
      includeInactive: false,
    });
    return { brand: doc };
  }

  // ─── Write operations (admin only) ───

  @Roles(ROLES.ADMIN, ROLES.SUPER_ADMIN)
  @Permissions("brands.manage")
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(createBrandSchema)) dto: CreateBrandInput
  ) {
    const brand = await this.brands.create(dto);
    return { brand };
  }

  @Roles(ROLES.ADMIN, ROLES.SUPER_ADMIN)
  @Permissions("brands.manage")
  @Patch(":id")
  async update(
    @Param("id", ObjectIdPipe) id: string,
    @Body(new ZodValidationPipe(updateBrandSchema)) dto: UpdateBrandInput
  ) {
    const brand = await this.brands.update(id, dto);
    return { brand };
  }

  @Roles(ROLES.ADMIN, ROLES.SUPER_ADMIN)
  @Permissions("brands.manage")
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id", ObjectIdPipe) id: string) {
    await this.brands.remove(id);
  }
}
