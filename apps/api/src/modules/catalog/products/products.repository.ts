import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, FilterQuery, Types } from "mongoose";
import { Product, ProductDocument } from "./schemas/product.schema";

@Injectable()
export class ProductsRepository {
  constructor(
    @InjectModel(Product.name) private readonly model: Model<ProductDocument>
  ) {}

  findById(id: string) {
    return this.model.findById(id).exec();
  }

  findPublishedByIds(ids: Types.ObjectId[]) {
    if (ids.length === 0) return Promise.resolve([]);
    return this.model.find({ _id: { $in: ids }, isPublished: true }).exec();
  }

  findBySlug(slug: string) {
    return this.model.findOne({ slug }).exec();
  }

  findBySku(sku: string) {
    return this.model.findOne({ sku }).exec();
  }

  find(filter: FilterQuery<ProductDocument> = {}, sort: Record<string, 1 | -1> = { createdAt: -1 }, skip = 0, limit = 20) {
    return this.model.find(filter).sort(sort).skip(skip).limit(limit).exec();
  }

  count(filter: FilterQuery<ProductDocument> = {}) {
    return this.model.countDocuments(filter).exec();
  }

  create(data: Partial<Product>) {
    return this.model.create(data);
  }

  updateById(id: string, update: Partial<Product> | Record<string, unknown>) {
    return this.model
      .findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .exec();
  }

  deleteById(id: string) {
    return this.model.findByIdAndDelete(id).exec();
  }
}
