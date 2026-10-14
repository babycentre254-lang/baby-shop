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
import { AddressesService } from "./addresses.service";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { ObjectIdPipe } from "../../common/pipes/object-id.pipe";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import {
  createAddressSchema,
  updateAddressSchema,
  type CreateAddressInput,
  type UpdateAddressInput,
} from "@baby-shop/shared";

@ApiTags("addresses")
@Controller("users/me/addresses")
export class AddressesController {
  constructor(private readonly addresses: AddressesService) {}

  @Get()
  @ApiOperation({ summary: "List my addresses" })
  async list(@CurrentUser("sub") userId: string) {
    const items = await this.addresses.list(userId);
    return { items };
  }

  @Get(":id")
  async getOne(
    @CurrentUser("sub") userId: string,
    @Param("id", ObjectIdPipe) id: string
  ) {
    const address = await this.addresses.getOne(userId, id);
    return { address };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser("sub") userId: string,
    @Body(new ZodValidationPipe(createAddressSchema)) dto: CreateAddressInput
  ) {
    const address = await this.addresses.create(userId, dto);
    return { address };
  }

  @Patch(":id")
  async update(
    @CurrentUser("sub") userId: string,
    @Param("id", ObjectIdPipe) id: string,
    @Body(new ZodValidationPipe(updateAddressSchema)) dto: UpdateAddressInput
  ) {
    const address = await this.addresses.update(userId, id, dto);
    return { address };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser("sub") userId: string,
    @Param("id", ObjectIdPipe) id: string
  ) {
    await this.addresses.remove(userId, id);
  }
}