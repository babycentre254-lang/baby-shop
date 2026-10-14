import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { ShippingService } from "./shipping.service";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { Public } from "../../common/decorators/public.decorator";
import {
  calculateShippingSchema,
  listShippingZonesQuerySchema,
  type CalculateShippingInput,
  type ListShippingZonesQuery,
} from "@baby-shop/shared";

@ApiTags("shipping")
@Controller("shipping")
export class ShippingController {
  constructor(private readonly shipping: ShippingService) {}

  @Public()
  @Get("zones")
  @ApiOperation({ summary: "List active shipping zones (public)" })
  listZones(
    @Query(new ZodValidationPipe(listShippingZonesQuerySchema))
    query: ListShippingZonesQuery
  ) {
    return this.shipping.list(query, { includeInactive: false });
  }

  @Public()
  @Post("quote")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Calculate shipping fee for a county + weight" })
  quote(
    @Body(new ZodValidationPipe(calculateShippingSchema))
    dto: CalculateShippingInput
  ) {
    return this.shipping.quote(dto);
  }
}