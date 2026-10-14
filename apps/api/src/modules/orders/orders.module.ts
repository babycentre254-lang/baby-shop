import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Order, OrderSchema } from "./schemas/order.schema";
import { CheckoutSession, CheckoutSessionSchema } from "./schemas/checkout-session.schema";
import { OrdersRepository } from "./orders.repository";
import { OrdersService } from "./orders.service";
import { OrdersController } from "./orders.controller";
import { AdminOrdersController } from "./admin-orders.controller";
import { CartModule } from "../cart/cart.module";
import { AddressesModule } from "../addresses/addresses.module";
import { ProductsModule } from "../catalog/products/products.module";
import { StoreSettings, StoreSettingsSchema } from "../admin/schemas/store-settings.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: CheckoutSession.name, schema: CheckoutSessionSchema },
      { name: StoreSettings.name, schema: StoreSettingsSchema },
    ]),
    CartModule,
    AddressesModule,
    ProductsModule,
    // ShippingModule is @Global() — no explicit import needed
  ],
  controllers: [OrdersController, AdminOrdersController],
  providers: [OrdersRepository, OrdersService],
  exports: [OrdersService, OrdersRepository, MongooseModule],
})
export class OrdersModule {}
