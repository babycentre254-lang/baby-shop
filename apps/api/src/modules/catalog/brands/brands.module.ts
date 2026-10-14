import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Brand, BrandSchema } from "./schemas/brand.schema";
import { BrandsRepository } from "./brands.repository";
import { BrandsService } from "./brands.service";
import { BrandsController } from "./brands.controller";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Brand.name, schema: BrandSchema }]),
  ],
  controllers: [BrandsController],
  providers: [BrandsRepository, BrandsService],
  exports: [BrandsService, BrandsRepository, MongooseModule],
})
export class BrandsModule {}
