import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, FilterQuery, Types } from "mongoose";
import { Order, OrderDocument } from "./schemas/order.schema";
import { ORDER_STATUS } from "@baby-shop/shared";

@Injectable()
export class OrdersRepository {
  constructor(
    @InjectModel(Order.name) private readonly model: Model<OrderDocument>
  ) {}

  findById(id: string) {
    return this.model.findById(id).exec();
  }

  findByNumber(orderNumber: string) {
    return this.model.findOne({ orderNumber }).exec();
  }

  findByCheckoutSession(sessionId: string) {
    return this.model.findOne({ checkoutSessionId: new Types.ObjectId(sessionId) }).exec();
  }

  find(
    filter: FilterQuery<OrderDocument> = {},
    sort: Record<string, 1 | -1> = { createdAt: -1 },
    skip = 0,
    limit = 20
  ) {
    return this.model.find(filter).sort(sort).skip(skip).limit(limit).exec();
  }

  count(filter: FilterQuery<OrderDocument> = {}) {
    return this.model.countDocuments(filter).exec();
  }

  findTrendingProductIds(since: Date, limit: number) {
    return this.model.aggregate<{ _id: Types.ObjectId; unitsSold: number }>([
      {
        $match: {
          status: {
            $in: [
              ORDER_STATUS.PAID,
              ORDER_STATUS.PROCESSING,
              ORDER_STATUS.SHIPPED,
              ORDER_STATUS.DELIVERED,
            ],
          },
          createdAt: { $gte: since },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          unitsSold: { $sum: "$items.quantity" },
        },
      },
      { $sort: { unitsSold: -1, _id: 1 } },
      { $limit: limit },
    ]).exec();
  }

  create(data: Partial<Order>) {
    return this.model.create(data);
  }

  updateById(id: string, update: Partial<Order> | Record<string, unknown>) {
    return this.model
      .findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .exec();
  }

  async generateOrderNumber(): Promise<string> {
    const now = new Date();
    const yyyy = now.getUTCFullYear();
    const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(now.getUTCDate()).padStart(2, "0");
    const datePart = `${yyyy}${mm}${dd}`;

    // Count today's orders and increment
    const startOfDay = new Date(Date.UTC(yyyy, now.getUTCMonth(), now.getUTCDate()));
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const count = await this.model.countDocuments({
      createdAt: { $gte: startOfDay, $lt: endOfDay },
    });

    const seq = String(count + 1).padStart(5, "0");
    return `BS-${datePart}-${seq}`;
  }
}
