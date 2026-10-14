import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Cart, CartDocument } from "./schemas/cart.schema";

@Injectable()
export class CartRepository {
  constructor(
    @InjectModel(Cart.name) private readonly model: Model<CartDocument>
  ) {}

  findByUser(userId: string) {
    return this.model.findOne({ userId: new Types.ObjectId(userId) }).exec();
  }

  async findByUserOrCreate(userId: string): Promise<CartDocument> {
    const existing = await this.findByUser(userId);
    if (existing) return existing;
    return this.model.create({ userId: new Types.ObjectId(userId), items: [] });
  }

  updateById(id: string, update: Partial<Cart>) {
    return this.model
      .findByIdAndUpdate(id, update, { new: true })
      .exec();
  }

  deleteByUser(userId: string) {
    return this.model
      .deleteOne({ userId: new Types.ObjectId(userId) })
      .exec();
  }
}