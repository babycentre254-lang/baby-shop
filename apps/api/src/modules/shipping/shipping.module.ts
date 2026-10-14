import { Global, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  ShippingZone,
  ShippingZoneSchema,
} from "./schemas/shipping-zone.schema";
import { ShippingRepository } from "./shipping.repository";
import { ShippingService } from "./shipping.service";
import { ShippingController } from "./shipping.controller";
import { AdminShippingController } from "./admin-shipping.controller";

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ShippingZone.name, schema: ShippingZoneSchema },
    ]),
  ],
  controllers: [ShippingController, AdminShippingController],
  providers: [ShippingRepository, ShippingService],
  exports: [ShippingService, ShippingRepository, MongooseModule],
})
export class ShippingModule {}