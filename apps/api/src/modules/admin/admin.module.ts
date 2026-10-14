import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UsersModule } from "../users/users.module";
import { Order, OrderSchema } from "../orders/schemas/order.schema";
import { Product, ProductSchema } from "../catalog/products/schemas/product.schema";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { Branch, BranchSchema } from "./schemas/branch.schema";
import { DraftOrder, DraftOrderSchema } from "./schemas/draft-order.schema";
import { StoreSettings, StoreSettingsSchema } from "./schemas/store-settings.schema";
import { StorefrontSettingsController } from "./storefront-settings.controller";

@Module({
  imports: [UsersModule, MongooseModule.forFeature([
    { name: Order.name, schema: OrderSchema },
    { name: Product.name, schema: ProductSchema },
    { name: Branch.name, schema: BranchSchema },
    { name: DraftOrder.name, schema: DraftOrderSchema },
    { name: StoreSettings.name, schema: StoreSettingsSchema },
  ])],
  controllers: [AdminController, StorefrontSettingsController],
  providers: [AdminService],
})
export class AdminModule {}

