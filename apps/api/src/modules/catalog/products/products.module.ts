import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Product, ProductSchema } from "./schemas/product.schema";
import { ProductsRepository } from "./products.repository";
import { ProductsService } from "./products.service";
import { ProductsController } from "./products.controller";
import { CategoriesModule } from "../categories/categories.module";
import { BrandsModule } from "../brands/brands.module";
import { AdminProductsController } from "./admin-products.controller";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    CategoriesModule,
    BrandsModule,
  ],
  controllers: [ProductsController, AdminProductsController],
  providers: [ProductsRepository, ProductsService],
  exports: [ProductsService, ProductsRepository, MongooseModule],
  
})
export class ProductsModule {}
