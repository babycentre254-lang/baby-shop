import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, FilterQuery, Types } from "mongoose";
import { Brand, BrandDocument } from "./schemas/brand.schema";

@Injectable()
export class BrandsRepository {
  constructor(
    @InjectModel(Brand.name) private readonly model: Model<BrandDocument>
  ) {}

  findById(id: string) {
    return this.model.findById(id).exec();
  }

  findBySlug(slug: string) {
    return this.model.findOne({ slug }).exec();
  }

  find(filter: FilterQuery<BrandDocument> = {}) {
    return this.model.find(filter).sort({ name: 1 }).exec();
  }

  count(filter: FilterQuery<BrandDocument> = {}) {
    return this.model.countDocuments(filter).exec();
  }

  create(data: Partial<Brand>) {
    return this.model.create(data);
  }

  updateById(id: string, update: Partial<Brand>) {
    return this.model
      .findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .exec();
  }

  deleteById(id: string) {
    return this.model.findByIdAndDelete(id).exec();
  }

  async hasProducts(id: string): Promise<boolean> {
    const exists = await this.model.db
      .collection("products")
      .findOne(
        { brandId: new Types.ObjectId(id) },
        { projection: { _id: 1 } }
      );
    return Boolean(exists);
  }
}