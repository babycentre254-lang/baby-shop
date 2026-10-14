import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Address, AddressDocument } from "./schemas/address.schema";

@Injectable()
export class AddressesRepository {
  constructor(
    @InjectModel(Address.name)
    private readonly model: Model<AddressDocument>
  ) {}

  findByUser(userId: string) {
    return this.model
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ isDefault: -1, createdAt: -1 })
      .exec();
  }

  findById(id: string) {
    return this.model.findById(id).exec();
  }

  findByIdForUser(id: string, userId: string) {
    return this.model
      .findOne({ _id: id, userId: new Types.ObjectId(userId) })
      .exec();
  }

  create(data: Partial<Address>) {
    return this.model.create(data);
  }

  updateById(id: string, update: Partial<Address>) {
    return this.model
      .findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .exec();
  }

  deleteById(id: string) {
    return this.model.findByIdAndDelete(id).exec();
  }

  async clearDefaultsForUser(userId: string, exceptId?: string) {
    const filter: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
      isDefault: true,
    };
    if (exceptId) filter._id = { $ne: new Types.ObjectId(exceptId) };
    await this.model.updateMany(filter, { $set: { isDefault: false } }).exec();
  }
}