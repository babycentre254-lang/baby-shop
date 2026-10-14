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
import { ShippingService } from "./shipping.service";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { ObjectIdPipe } from "../../common/pipes/object-id.pipe";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import {
  createShippingZoneSchema,
  updateShippingZoneSchema,
  listShippingZonesQuerySchema,
  ROLES,
  type CreateShippingZoneInput,
  type UpdateShippingZoneInput,
  type ListShippingZonesQuery,
} from "@baby-shop/shared";

@ApiTags("admin/shipping")
@Controller("admin/shipping")
@Roles(ROLES.ADMIN, ROLES.SUPER_ADMIN)
export class AdminShippingController {
  constructor(private readonly shipping: ShippingService) {}

  @Get()
  @Permissions("shipping.view")
  @ApiOperation({ summary: "List all shipping zones (admin)" })
  list(
    @Query(new ZodValidationPipe(listShippingZonesQuerySchema))
    query: ListShippingZonesQuery
  ) {
    return this.shipping.list(query, { includeInactive: true });
  }

  @Get(":id")
  @Permissions("shipping.view")
  @ApiOperation({ summary: "Get a shipping zone (admin)" })
  async getOne(@Param("id", ObjectIdPipe) id: string) {
    const zone = await this.shipping.getOne(id);
    return { zone };
  }

  @Post()
  @Permissions("shipping.manage")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a shipping zone (admin)" })
  async create(
    @Body(new ZodValidationPipe(createShippingZoneSchema))
    dto: CreateShippingZoneInput
  ) {
    const zone = await this.shipping.create(dto);
    return { zone };
  }

  @Patch(":id")
  @Permissions("shipping.manage")
  @ApiOperation({ summary: "Update a shipping zone (admin)" })
  async update(
    @Param("id", ObjectIdPipe) id: string,
    @Body(new ZodValidationPipe(updateShippingZoneSchema))
    dto: UpdateShippingZoneInput
  ) {
    const zone = await this.shipping.update(id, dto);
    return { zone };
  }

  @Delete(":id")
  @Permissions("shipping.manage")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a shipping zone (admin)" })
  async remove(@Param("id", ObjectIdPipe) id: string) {
    await this.shipping.remove(id);
  }
}
