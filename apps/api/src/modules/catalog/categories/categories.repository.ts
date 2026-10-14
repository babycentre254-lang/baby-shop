import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, FilterQuery, Types } from "mongoose";
import { Category, CategoryDocument } from "./schemas/category.schema";

@Injectable()
export class CategoriesRepository {
  constructor(
    @InjectModel(Category.name)
    private readonly model: Model<CategoryDocument>
  ) {}

  findById(id: string) {
    return this.model.findById(id).exec();
  }

  findBySlug(slug: string) {
    return this.model.findOne({ slug }).exec();
  }

  find(filter: FilterQuery<CategoryDocument> = {}) {
    return this.model.find(filter).sort({ sortOrder: 1, name: 1 }).exec();
  }

  count(filter: FilterQuery<CategoryDocument> = {}) {
    return this.model.countDocuments(filter).exec();
  }

  create(data: Partial<Category>) {
    return this.model.create(data);
  }

  updateById(id: string, update: Partial<Category>) {
    return this.model
      .findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .exec();
  }

  deleteById(id: string) {
    return this.model.findByIdAndDelete(id).exec();
  }

  async hasChildren(id: string): Promise<boolean> {
    const exists = await this.model.exists({
      parentId: new Types.ObjectId(id),
    });
    return Boolean(exists);
  }

  async hasProducts(id: string): Promise<boolean> {
    // Products collection — loaded lazily by mongoose connection
    const db = this.model.db;
    const exists = await db
      .collection("products")
      .findOne({ categoryId: new Types.ObjectId(id) }, { projection: { _id: 1 } });
    return Boolean(exists);
  }
}