import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Payment, PaymentDocument } from "./schemas/payment.schema";

@Injectable()
export class PaymentsRepository {
  constructor(
    @InjectModel(Payment.name)
    private readonly model: Model<PaymentDocument>
  ) {}

  findById(id: string) {
    return this.model.findById(id).exec();
  }

  findByCheckoutRequestId(checkoutRequestId: string) {
    return this.model.findOne({ checkoutRequestId }).exec();
  }

  findPendingByOrder(orderId: string) {
    return this.model
      .findOne({
        orderId: new Types.ObjectId(orderId),
        status: "PENDING",
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  findPendingBySession(sessionId: string) {
    return this.model.findOne({ checkoutSessionId: new Types.ObjectId(sessionId), status: "PENDING" }).sort({ createdAt: -1 }).exec();
  }

  findLatestBySession(sessionId: string) {
    return this.model.findOne({ checkoutSessionId: new Types.ObjectId(sessionId) }).sort({ createdAt: -1 }).exec();
  }

  create(data: Partial<Payment>) {
    return this.model.create(data);
  }

  updateById(id: string, update: Partial<Payment>) {
    return this.model
      .findByIdAndUpdate(id, update, { new: true })
      .exec();
  }

  /**
   * Idempotency: mark a payment as SUCCESS only if it's still PENDING.
   * Returns the updated doc, or null if it was already processed.
   */
  markSuccessIfPending(id: string, update: Partial<Payment>) {
    return this.model
      .findOneAndUpdate(
        { _id: id, status: "PENDING" },
        { $set: { ...update, status: "SUCCESS" } },
        { new: true }
      )
      .exec();
  }

  markFailedIfPending(id: string, update: Partial<Payment>) {
    return this.model
      .findOneAndUpdate(
        { _id: id, status: "PENDING" },
        { $set: { ...update, status: "FAILED" } },
        { new: true }
      )
      .exec();
  }
}
