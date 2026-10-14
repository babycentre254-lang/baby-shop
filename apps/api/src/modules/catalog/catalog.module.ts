import { Module } from "@nestjs/common";
import { CategoriesModule } from "./categories/categories.module";
import { BrandsModule } from "./brands/brands.module";
import { ProductsModule } from "./products/products.module";

@Module({
  imports: [CategoriesModule, BrandsModule, ProductsModule],
  exports: [CategoriesModule, BrandsModule, ProductsModule],
})
export class CatalogModule {}