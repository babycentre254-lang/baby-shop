import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";

import configuration from "./config/configuration";
import { validateEnv } from "./config/env.validation";
import { DatabaseModule } from "./modules/database/database.module";
import { HealthModule } from "./modules/health/health.module";
import { UsersModule } from "./modules/users/users.module";
import { AuthModule } from "./modules/auth/auth.module";
import { CatalogModule } from "./modules/catalog/catalog.module";
import { CartModule } from "./modules/cart/cart.module";
import { ShippingModule } from "./modules/shipping/shipping.module";
import { AddressesModule } from "./modules/addresses/addresses.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { CommonServicesModule } from "./common/services/services.module";
import { AdminModule } from "./modules/admin/admin.module";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import { PermissionsGuard } from "./common/guards/permissions.guard";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
      envFilePath: [".env"],
    }),
    ThrottlerModule.forRoot([
      { name: "default", ttl: 60_000, limit: 100 },
    ]),
    DatabaseModule,
    CommonServicesModule,
    UsersModule,
    AuthModule,
    CatalogModule,
    ShippingModule,
    CartModule,
    AddressesModule,
    PaymentsModule,
    OrdersModule,
    AdminModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
