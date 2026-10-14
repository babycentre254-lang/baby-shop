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

import { CategoriesService } from "./categories.service";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import { ObjectIdPipe } from "../../../common/pipes/object-id.pipe";
import { Public } from "../../../common/decorators/public.decorator";
import { Roles } from "../../../common/decorators/roles.decorator";
import { Permissions } from "../../../common/decorators/permissions.decorator";
import {
  createCategorySchema,
  updateCategorySchema,
  listCategoriesQuerySchema,
  ROLES,
  type CreateCategoryInput,
  type UpdateCategoryInput,
  type ListCategoriesQuery,
} from "@baby-shop/shared";

@ApiTags("categories")
@Controller("categories")
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  // ═══════════════════════════════════════════════════════════
  // ADMIN ROUTES (must come before :slugOrId to avoid capture)
  // ═══════════════════════════════════════════════════════════

  @Roles(ROLES.ADMIN, ROLES.SUPER_ADMIN)
  @Permissions("categories.view", "products.manage")
  @Get("admin/list")
  @ApiOperation({
    summary: "List all categories including inactive (admin)",
  })
  listAdmin(
    @Query(new ZodValidationPipe(listCategoriesQuerySchema))
    query: ListCategoriesQuery
  ) {
    return this.categories.list(query, { includeInactive: true });
  }

  @Roles(ROLES.ADMIN, ROLES.SUPER_ADMIN)
  @Permissions("categories.view")
  @Get("admin/:id")
  @ApiOperation({
    summary: "Get any category by id, including inactive (admin)",
  })
  async getOneAdmin(@Param("id", ObjectIdPipe) id: string) {
    const doc = await this.categories.findBySlugOrId(id, {
      includeInactive: true,
    });
    return { category: doc };
  }

  // ═══════════════════════════════════════════════════════════
  // PUBLIC ROUTES
  // ═══════════════════════════════════════════════════════════

  @Public()
  @Get()
  @ApiOperation({ summary: "List active categories (public)" })
  list(
    @Query(new ZodValidationPipe(listCategoriesQuerySchema))
    query: ListCategoriesQuery
  ) {
    return this.categories.list(query, { includeInactive: false });
  }

  @Public()
  @Get(":slugOrId")
  @ApiOperation({ summary: "Get category by slug or id (public)" })
  async getOne(@Param("slugOrId") slugOrId: string) {
    const doc = await this.categories.findBySlugOrId(slugOrId, {
      includeInactive: false,
    });
    return { category: doc };
  }

  // ═══════════════════════════════════════════════════════════
  // WRITE OPERATIONS (admin only)
  // ═══════════════════════════════════════════════════════════

  @Roles(ROLES.ADMIN, ROLES.SUPER_ADMIN)
  @Permissions("categories.manage")
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a category (admin)" })
  async create(
    @Body(new ZodValidationPipe(createCategorySchema)) dto: CreateCategoryInput
  ) {
    const category = await this.categories.create(dto);
    return { category };
  }

  @Roles(ROLES.ADMIN, ROLES.SUPER_ADMIN)
  @Permissions("categories.manage")
  @Patch(":id")
  @ApiOperation({ summary: "Update a category (admin)" })
  async update(
    @Param("id", ObjectIdPipe) id: string,
    @Body(new ZodValidationPipe(updateCategorySchema)) dto: UpdateCategoryInput
  ) {
    const category = await this.categories.update(id, dto);
    return { category };
  }

  @Roles(ROLES.ADMIN, ROLES.SUPER_ADMIN)
  @Permissions("categories.manage")
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a category (admin)" })
  async remove(@Param("id", ObjectIdPipe) id: string) {
    await this.categories.remove(id);
  }
}
