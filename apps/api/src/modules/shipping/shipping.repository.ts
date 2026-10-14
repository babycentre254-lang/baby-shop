import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, FilterQuery } from "mongoose";
import {
  ShippingZone,
  ShippingZoneDocument,
} from "./schemas/shipping-zone.schema";

@Injectable()
export class ShippingRepository {
  constructor(
    @InjectModel(ShippingZone.name)
    private readonly model: Model<ShippingZoneDocument>
  ) {}

  find(filter: FilterQuery<ShippingZoneDocument> = {}) {
    return this.model.find(filter).sort({ county: 1 }).exec();
  }

  count(filter: FilterQuery<ShippingZoneDocument> = {}) {
    return this.model.countDocuments(filter).exec();
  }

  findById(id: string) {
    return this.model.findById(id).exec();
  }

  findByCounty(county: string) {
    const escaped = county.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return this.model
      .findOne({ county: { $regex: `^${escaped}$`, $options: "i" }, isActive: true })
      .exec();
  }

  create(data: Partial<ShippingZone>) {
    return this.model.create(data);
  }

  updateById(id: string, update: Partial<ShippingZone>) {
    return this.model
      .findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .exec();
  }

  deleteById(id: string) {
    return this.model.findByIdAndDelete(id).exec();
  }
}
