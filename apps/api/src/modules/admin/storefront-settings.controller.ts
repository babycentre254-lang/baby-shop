import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "../../common/decorators/public.decorator";
import { AdminService } from "./admin.service";

@ApiTags("storefront")
@Controller("storefront")
export class StorefrontSettingsController {
  constructor(private readonly admin: AdminService) {}

  @Public()
  @Get("checkout-options")
  @ApiOperation({ summary: "Get checkout payment options" })
  checkoutOptions() { return this.admin.getCheckoutOptions(); }
}
