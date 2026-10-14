import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { StoreSettings, type StoreSettingsDocument } from "../admin/schemas/store-settings.schema";

import { OrdersRepository } from "./orders.repository";
import { OrderDocument, OrderItemSnapshot } from "./schemas/order.schema";
import { CheckoutSession, CheckoutSessionDocument, CHECKOUT_SESSION_STATUS, type CheckoutSessionStatus } from "./schemas/checkout-session.schema";
import { CartService } from "../cart/cart.service";
import { CartRepository } from "../cart/cart.repository";
import { AddressesService } from "../addresses/addresses.service";
import { ProductsRepository } from "../catalog/products/products.repository";
import { ShippingService } from "../shipping/shipping.service";
import { buildPaginated, parseSort } from "../../common/utils/pagination.util";
import {
  ORDER_STATUS,
  OrderStatus,
  type CheckoutInput,
  type ListOrdersQuery,
  type UpdateOrderStatusInput,
} from "@baby-shop/shared";

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PAID]: [
    ORDER_STATUS.PROCESSING,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.REFUNDED,
  ],
  [ORDER_STATUS.PROCESSING]: [
    ORDER_STATUS.SHIPPED,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.REFUNDED,
  ],
  [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED, ORDER_STATUS.REFUNDED],
  [ORDER_STATUS.DELIVERED]: [ORDER_STATUS.REFUNDED],
  [ORDER_STATUS.CANCELLED]: [],
  [ORDER_STATUS.REFUNDED]: [],
};

@Injectable()
export class OrdersService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrdersService.name);
  private expiryTimer?: NodeJS.Timeout;

  constructor(
    private readonly repo: OrdersRepository,
    private readonly carts: CartService,
    private readonly cartRepo: CartRepository,
    private readonly addresses: AddressesService,
    private readonly products: ProductsRepository,
    private readonly shipping: ShippingService,
    @InjectModel(CheckoutSession.name)
    private readonly checkoutSessions: Model<CheckoutSessionDocument>,
    @InjectModel(StoreSettings.name)
    private readonly storeSettings: Model<StoreSettingsDocument>
  ) {}

  onModuleInit() {
    this.expiryTimer = setInterval(() => void this.expireCheckoutSessions(), 60_000);
    this.expiryTimer.unref();
    void this.expireCheckoutSessions();
  }

  onModuleDestroy() {
    if (this.expiryTimer) clearInterval(this.expiryTimer);
  }

  async createCheckoutSession(userId: string, input: CheckoutInput) {
    if (input.paymentProvider === "COD") await this.assertCashOnDeliveryEnabled();
    const cart = await this.carts.getCart(userId);
    if (!cart.items.length) throw new BadRequestException({ code: "EMPTY_CART", message: "Your cart is empty" });
    const address = await this.addresses.getOne(userId, input.addressId);
    const quote = await this.shipping.quote({ county: address.county, totalWeightGrams: cart.totalWeightGrams });
    if (input.expectedShippingFee !== undefined && input.expectedShippingFee !== quote.totalFee) {
      throw new BadRequestException({ code: "SHIPPING_FEE_MISMATCH", message: "Shipping fee has changed since you loaded the page. Please review and try again.", details: { expected: input.expectedShippingFee, actual: quote.totalFee } });
    }

    const items = cart.items.map((item) => ({
      variantId: new Types.ObjectId(item.variantId), productId: new Types.ObjectId(item.productId),
      productName: item.product.name, productSlug: item.product.slug, image: item.product.image,
      sku: item.variant.sku, size: item.variant.size, color: item.variant.color,
      unitPrice: item.unitPrice, quantity: item.quantity, lineTotal: item.lineTotal,
      unitWeightGrams: item.unitWeightGrams ?? 0,
    }));
    const reservation = items.map((item) => ({ variantId: item.variantId, quantity: item.quantity, productName: item.productName }));
    await this.reserveInventory(reservation);

    let session: CheckoutSessionDocument;
    try {
      session = await this.checkoutSessions.create({
        userId: new Types.ObjectId(userId), status: CHECKOUT_SESSION_STATUS.AWAITING_PAYMENT,
        paymentProvider: input.paymentProvider,
        shippingAddress: { fullName: address.fullName, phone: address.phone, county: address.county, town: address.town, street: address.street, notes: address.notes },
        shippingMeta: { zoneId: quote.zoneId ? new Types.ObjectId(quote.zoneId) : null, zoneLabel: quote.zoneLabel, etaText: quote.etaText, totalWeightGrams: quote.totalWeightGrams, baseFee: quote.baseFee, additionalFee: quote.additionalFee, isFallback: quote.isFallback },
        items, subtotal: cart.subtotal, shippingFee: quote.totalFee, discount: 0, total: cart.subtotal + quote.totalFee,
        notes: input.notes, inventoryReserved: true, expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      });
    } catch (error) {
      await this.releaseInventory(reservation);
      throw error;
    }

    if (input.paymentProvider === "COD") {
      const order = await this.createOrderFromCheckoutSession(session._id.toString(), ORDER_STATUS.PENDING);
      const completed = await this.checkoutSessions.findById(session._id).exec();
      return { session: completed ?? session, order };
    }
    return { session, order: null };
  }

  async getTrendingProducts(limit = 8) {
    const since = new Date();
    since.setDate(since.getDate() - 90);
    const ranked = await this.repo.findTrendingProductIds(since, limit);
    const products = await this.products.findPublishedByIds(
      ranked.map((entry) => entry._id)
    );
    const productsById = new Map(
      products.map((product) => [product._id.toString(), product])
    );

    return ranked
      .map((entry) => productsById.get(entry._id.toString()))
      .filter((product): product is NonNullable<typeof product> => !!product);
  }

  async getCheckoutSession(userId: string, id: string) {
    const session = await this.checkoutSessions.findById(id).exec();
    if (!session) throw new NotFoundException({ code: "CHECKOUT_SESSION_NOT_FOUND", message: "Checkout session not found" });
    if (session.userId.toString() !== userId) throw new ForbiddenException({ code: "NOT_YOUR_CHECKOUT_SESSION", message: "This checkout session does not belong to you" });
    if (session.expiresAt <= new Date() && session.status !== CHECKOUT_SESSION_STATUS.COMPLETED) await this.expireCheckoutSession(session);
    return (await this.checkoutSessions.findById(id).exec()) ?? session;
  }

  async getCheckoutSessionStatus(userId: string, id: string) {
    const session = await this.getCheckoutSession(userId, id);
    const order = session.orderId ? await this.repo.findById(session.orderId.toString()) : await this.repo.findByCheckoutSession(id);
    return { session: { _id: session._id, status: session.status, paymentProvider: session.paymentProvider, total: session.total, expiresAt: session.expiresAt }, order: order ? { _id: order._id, orderNumber: order.orderNumber, status: order.status, total: order.total } : null };
  }

  async setCheckoutSessionPaymentPending(id: string) {
    const session = await this.checkoutSessions.findOneAndUpdate(
      { _id: id, status: { $in: [CHECKOUT_SESSION_STATUS.AWAITING_PAYMENT, CHECKOUT_SESSION_STATUS.PAYMENT_FAILED] }, expiresAt: { $gt: new Date() } },
      { $set: { status: CHECKOUT_SESSION_STATUS.PAYMENT_PENDING } }, { new: true }
    ).exec();
    if (!session) throw new BadRequestException({ code: "CHECKOUT_SESSION_NOT_PAYABLE", message: "This checkout session has expired or is no longer payable. Return to checkout to start again." });
    return session;
  }

  async setCheckoutSessionPaymentFailed(id: string) {
    await this.checkoutSessions.updateOne({ _id: id, status: CHECKOUT_SESSION_STATUS.PAYMENT_PENDING }, { $set: { status: CHECKOUT_SESSION_STATUS.PAYMENT_FAILED } }).exec();
  }

  async createOrderFromCheckoutSession(id: string, status: OrderStatus): Promise<OrderDocument> {
    let session = await this.checkoutSessions.findById(id).exec();
    if (!session) throw new NotFoundException({ code: "CHECKOUT_SESSION_NOT_FOUND", message: "Checkout session not found" });
    const existing = session.orderId ? await this.repo.findById(session.orderId.toString()) : await this.repo.findByCheckoutSession(id);
    if (existing) {
      await this.checkoutSessions.updateOne({ _id: id }, { $set: { orderId: existing._id, status: CHECKOUT_SESSION_STATUS.COMPLETED, inventoryReserved: false } }).exec();
      return existing;
    }

    if (!session.inventoryReserved) {
      const reservation = session.items.map((item: any) => ({ variantId: new Types.ObjectId(item.variantId), quantity: Number(item.quantity), productName: String(item.productName) }));
      try { await this.reserveInventory(reservation); }
      catch (error) {
        await this.checkoutSessions.updateOne({ _id: id }, { $set: { status: CHECKOUT_SESSION_STATUS.PAID_REVIEW } }).exec();
        throw new BadRequestException({ code: "PAID_ORDER_STOCK_REVIEW", message: "Payment was received, but the reserved stock needs staff review before we can confirm this order." });
      }
      await this.checkoutSessions.updateOne({ _id: id }, { $set: { inventoryReserved: true } }).exec();
      session = (await this.checkoutSessions.findById(id).exec())!;
    }

    const orderStatus = status;
    let order: OrderDocument;
    try {
      order = await this.repo.create({
        checkoutSessionId: session._id, orderNumber: await this.repo.generateOrderNumber(), userId: session.userId,
        status: orderStatus, paymentProvider: session.paymentProvider, subtotal: session.subtotal, shippingFee: session.shippingFee,
        discount: session.discount, total: session.total, shippingAddress: session.shippingAddress as any,
        shippingMeta: session.shippingMeta as any, items: session.items as any,
        statusHistory: [{ status: orderStatus, at: new Date(), note: status === ORDER_STATUS.PAID ? "M-Pesa payment confirmed" : "Order placed — cash on delivery" }],
        notes: session.notes,
      });
    } catch (error) {
      if ((error as any)?.code !== 11000) throw error;
      const duplicate = await this.repo.findByCheckoutSession(id);
      if (!duplicate) throw error;
      order = duplicate;
    }

    await this.checkoutSessions.updateOne({ _id: id }, { $set: { orderId: order._id, status: CHECKOUT_SESSION_STATUS.COMPLETED, inventoryReserved: false } }).exec();
    try { await this.clearPurchasedCartItems(session.userId.toString(), session.items as any[]); }
    catch (error) { this.logger.error(`Order ${order.orderNumber} created but cart cleanup failed: ${(error as Error).message}`); }
    return order;
  }

  async cancelUnpaidPosSale(orderId: string, reason: string) {
    const order = await this.repo.findById(orderId);
    if (!order || (order as any).salesChannel !== "POS" || order.status !== ORDER_STATUS.PENDING || order.paymentProvider !== "MPESA") return;
    const updated = await this.repo.updateById(orderId, { status: ORDER_STATUS.CANCELLED, cancelReason: reason, $push: { statusHistory: { status: ORDER_STATUS.CANCELLED, note: reason, at: new Date() } } } as any);
    if (!updated) return;
    for (const item of order.items) {
      await this.products["model"].updateOne({ "variants._id": item.variantId }, { $inc: { "variants.$.stock": item.quantity } }).exec();
    }
  }

  async cancelCheckoutSession(userId: string, id: string) {
    const session = await this.getCheckoutSession(userId, id);
    if (session.status === CHECKOUT_SESSION_STATUS.COMPLETED) throw new BadRequestException({ code: "CHECKOUT_SESSION_COMPLETED", message: "This checkout has already become an order." });
    await this.expireCheckoutSession(session, CHECKOUT_SESSION_STATUS.CANCELLED);
    return { cancelled: true };
  }

  private async reserveInventory(items: { variantId: Types.ObjectId; quantity: number; productName: string }[]) {
    const reserved: typeof items = [];
    try {
      for (const item of items) {
        const result = await this.products["model"].updateOne(
          { variants: { $elemMatch: { _id: item.variantId, stock: { $gte: item.quantity } } } },
          { $inc: { "variants.$.stock": -item.quantity } }
        ).exec();
        if (result.modifiedCount !== 1) throw new BadRequestException({ code: "INSUFFICIENT_STOCK", message: `"${item.productName}" no longer has enough stock. Review your cart and try again.` });
        reserved.push(item);
      }
    } catch (error) {
      await this.releaseInventory(reserved);
      throw error;
    }
  }

  private async releaseInventory(items: { variantId: Types.ObjectId; quantity: number }[]) {
    for (const item of items) await this.products["model"].updateOne({ "variants._id": item.variantId }, { $inc: { "variants.$.stock": item.quantity } }).exec();
  }

  private async clearPurchasedCartItems(userId: string, items: { variantId: Types.ObjectId; quantity: number }[]) {
    const cart = await this.cartRepo.findByUser(userId);
    if (!cart) return;
    const purchased = new Map(items.map((item) => [item.variantId.toString(), item.quantity]));
    cart.items = cart.items.flatMap((item) => {
      const quantity = purchased.get(item.variantId.toString()) ?? 0;
      if (!quantity) return [item];
      purchased.delete(item.variantId.toString());
      const remaining = item.quantity - quantity;
      if (remaining <= 0) return [];
      item.quantity = remaining;
      return [item];
    }) as typeof cart.items;
    await cart.save();
  }

  private async expireCheckoutSessions() {
    const due = await this.checkoutSessions.find({ status: { $in: [CHECKOUT_SESSION_STATUS.AWAITING_PAYMENT, CHECKOUT_SESSION_STATUS.PAYMENT_PENDING, CHECKOUT_SESSION_STATUS.PAYMENT_FAILED, CHECKOUT_SESSION_STATUS.PAID_REVIEW] }, expiresAt: { $lte: new Date() } }).limit(100).exec();
    for (const session of due) await this.expireCheckoutSession(session);
  }

  private async expireCheckoutSession(session: CheckoutSessionDocument, status: CheckoutSessionStatus = CHECKOUT_SESSION_STATUS.EXPIRED) {
    const hadReservation = session.inventoryReserved;
    const updated = await this.checkoutSessions.findOneAndUpdate(
      { _id: session._id, status: { $in: [CHECKOUT_SESSION_STATUS.AWAITING_PAYMENT, CHECKOUT_SESSION_STATUS.PAYMENT_PENDING, CHECKOUT_SESSION_STATUS.PAYMENT_FAILED, CHECKOUT_SESSION_STATUS.PAID_REVIEW] } },
      { $set: { status, inventoryReserved: false } }, { new: true }
    ).exec();
    if (updated && hadReservation) {
      const items = updated.items.map((item: any) => ({ variantId: new Types.ObjectId(item.variantId), quantity: Number(item.quantity) }));
      await this.releaseInventory(items);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // Checkout — creates an order from the current user's cart
  // ═══════════════════════════════════════════════════════════

  private async legacyCheckout(
    userId: string,
    input: CheckoutInput
  ): Promise<OrderDocument> {
    if (input.paymentProvider === "COD") await this.assertCashOnDeliveryEnabled();
    // 1. Get cart (now includes totalWeightGrams)
    const cart = await this.carts.getCart(userId);
    if (!cart.items.length) {
      throw new BadRequestException({
        code: "EMPTY_CART",
        message: "Your cart is empty",
      });
    }

    // 2. Get address (determines the shipping county)
    const address = await this.addresses.getOne(userId, input.addressId);

    // 3. Validate stock for every item
    for (const item of cart.items) {
      if (item.quantity > item.availableStock) {
        throw new BadRequestException({
          code: "INSUFFICIENT_STOCK",
          message: `"${item.product.name}" only has ${item.availableStock} in stock`,
          details: {
            variantId: item.variantId,
            available: item.availableStock,
          },
        });
      }
    }

    // 4. Compute shipping from real cart weight + address county
    const quote = await this.shipping.quote({
      county: address.county,
      totalWeightGrams: cart.totalWeightGrams,
    });

    // 5. Client-provided fee tamper check
    if (
      input.expectedShippingFee !== undefined &&
      input.expectedShippingFee !== quote.totalFee
    ) {
      throw new BadRequestException({
        code: "SHIPPING_FEE_MISMATCH",
        message:
          "Shipping fee has changed since you loaded the page. Please review and try again.",
        details: {
          expected: input.expectedShippingFee,
          actual: quote.totalFee,
        },
      });
    }

    // 6. Build order item snapshots
    const orderItems: Partial<OrderItemSnapshot>[] = cart.items.map((item) => ({
      variantId: new Types.ObjectId(item.variantId),
      productId: new Types.ObjectId(item.productId),
      productName: item.product.name,
      productSlug: item.product.slug,
      image: item.product.image,
      sku: item.variant.sku,
      size: item.variant.size,
      color: item.variant.color,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
      unitWeightGrams: item.unitWeightGrams ?? 0,
    }));

    // 7. Compute totals from backend data only
    const subtotal = cart.subtotal;
    const shippingFee = quote.totalFee;
    const total = subtotal + shippingFee;

    // 8. Generate order number
    const orderNumber = await this.repo.generateOrderNumber();

    // 9. Persist the order
    const order = await this.repo.create({
      orderNumber,
      userId: new Types.ObjectId(userId),
      status: ORDER_STATUS.PENDING,
      paymentProvider: input.paymentProvider,
      subtotal,
      shippingFee,
      discount: 0,
      total,
      shippingAddress: {
        fullName: address.fullName,
        phone: address.phone,
        county: address.county,
        town: address.town,
        street: address.street,
        notes: address.notes,
      },
      shippingMeta: {
        zoneId: quote.zoneId ? new Types.ObjectId(quote.zoneId) : null,
        zoneLabel: quote.zoneLabel,
        etaText: quote.etaText,
        totalWeightGrams: quote.totalWeightGrams,
        baseFee: quote.baseFee,
        additionalFee: quote.additionalFee,
        isFallback: quote.isFallback,
      },
      items: orderItems as OrderItemSnapshot[],
      statusHistory: [
        {
          status: ORDER_STATUS.PENDING,
          at: new Date(),
          note: "Order created",
        },
      ],
      notes: input.notes,
    });

    // 10. Decrement stock for each variant
    for (const item of cart.items) {
      await this.products["model"]
        .updateOne(
          { "variants._id": new Types.ObjectId(item.variantId) },
          { $inc: { "variants.$.stock": -item.quantity } }
        )
        .exec();
    }

    // 11. Clear the cart
    await this.carts.clearByUser(userId);

    return order;
  }

  private async assertCashOnDeliveryEnabled() {
    const settings = await this.storeSettings.findOne().select("cashOnDeliveryEnabled").lean().exec();
    if (settings?.cashOnDeliveryEnabled === false) {
      throw new BadRequestException({ code: "COD_DISABLED", message: "Pay on delivery is temporarily unavailable. Please choose M-Pesa." });
    }
  }

  // ═══════════════════════════════════════════════════════════
  // Lists
  // ═══════════════════════════════════════════════════════════

  async listMine(userId: string, query: ListOrdersQuery) {
    const filter: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
    };
    if (query.status) filter.status = query.status;
    return this.paginate(filter, query);
  }

  async listAll(query: ListOrdersQuery) {
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.userId) filter.userId = new Types.ObjectId(query.userId);
    return this.paginate(filter, query);
  }

  async listCheckoutSessionsForAdmin() {
    const items = await this.checkoutSessions.find({ status: { $ne: CHECKOUT_SESSION_STATUS.COMPLETED } }).sort({ createdAt: -1 }).limit(200).lean().exec();
    return {
      items: items.map((session: any) => ({
        _id: session._id.toString(), status: session.status, paymentProvider: session.paymentProvider,
        total: session.total, createdAt: session.createdAt, expiresAt: session.expiresAt,
        county: session.shippingAddress?.county, town: session.shippingAddress?.town,
        recipient: session.shippingAddress?.fullName, phone: session.shippingAddress?.phone, inventoryReserved: session.inventoryReserved,
      })),
      total: items.length,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // Single-order reads
  // ═══════════════════════════════════════════════════════════

  async getMine(userId: string, id: string): Promise<OrderDocument> {
    const order = await this.repo.findById(id);
    if (!order) {
      throw new NotFoundException({
        code: "ORDER_NOT_FOUND",
        message: "Order not found",
      });
    }
    if (order.userId.toString() !== userId) {
      throw new ForbiddenException({
        code: "NOT_YOUR_ORDER",
        message: "This order does not belong to you",
      });
    }
    return order;
  }

  // ═══════════════════════════════════════════════════════════
  // Cancel — restores stock, transitions to CANCELLED
  // ═══════════════════════════════════════════════════════════

  async cancelMine(
    userId: string,
    id: string,
    reason?: string
  ): Promise<OrderDocument> {
    const order = await this.getMine(userId, id);

    const cancellableStatuses: OrderStatus[] = [
      ORDER_STATUS.PENDING,
      ORDER_STATUS.PAID,
      ORDER_STATUS.PROCESSING,
    ];

    if (!cancellableStatuses.includes(order.status)) {
      throw new BadRequestException({
        code: "CANNOT_CANCEL",
        message: `Order in status "${order.status}" cannot be cancelled`,
      });
    }

    // Restore stock
    for (const item of order.items) {
      await this.products["model"]
        .updateOne(
          { "variants._id": item.variantId },
          { $inc: { "variants.$.stock": item.quantity } }
        )
        .exec();
    }

    const updated = await this.repo.updateById(id, {
      status: ORDER_STATUS.CANCELLED,
      cancelReason: reason,
      $push: {
        statusHistory: {
          status: ORDER_STATUS.CANCELLED,
          note: reason ?? "Cancelled by customer",
          at: new Date(),
          by: new Types.ObjectId(userId),
        },
      },
    } as any);

    return updated!;
  }

  // ═══════════════════════════════════════════════════════════
  // Admin: status transitions
  // ═══════════════════════════════════════════════════════════

  async updateStatus(
    id: string,
    input: UpdateOrderStatusInput,
    byUserId: string
  ): Promise<OrderDocument> {
    const order = await this.repo.findById(id);
    if (!order) {
      throw new NotFoundException({
        code: "ORDER_NOT_FOUND",
        message: "Order not found",
      });
    }

    const next = input.status as OrderStatus;
    if (next === ORDER_STATUS.PAID) {
      throw new BadRequestException({
        code: "PAYMENT_STATUS_PROVIDER_MANAGED",
        message: "Payment status is confirmed by the payment provider and cannot be changed by an admin.",
      });
    }
    if (order.status === ORDER_STATUS.PENDING && next === ORDER_STATUS.PROCESSING && order.paymentProvider !== "COD") {
      throw new BadRequestException({
        code: "PAYMENT_REQUIRED_BEFORE_PROCESSING",
        message: "This order must be paid before it can enter fulfillment.",
      });
    }
    const allowed = ALLOWED_TRANSITIONS[order.status];

    if (!allowed.includes(next)) {
      throw new BadRequestException({
        code: "INVALID_STATUS_TRANSITION",
        message: `Cannot transition from "${order.status}" to "${next}"`,
        details: { from: order.status, to: next, allowed },
      });
    }

    // Restore stock when transitioning to a terminal "unfulfilled" state
    if (
      next === ORDER_STATUS.CANCELLED ||
      next === ORDER_STATUS.REFUNDED
    ) {
      for (const item of order.items) {
        await this.products["model"]
          .updateOne(
            { "variants._id": item.variantId },
            { $inc: { "variants.$.stock": item.quantity } }
          )
          .exec();
      }
    }

    const updated = await this.repo.updateById(id, {
      status: next,
      $push: {
        statusHistory: {
          status: next,
          note: input.note,
          at: new Date(),
          by: new Types.ObjectId(byUserId),
        },
      },
    } as any);

    return updated!;
  }

  // ═══════════════════════════════════════════════════════════
  // Helpers
  // ═══════════════════════════════════════════════════════════

  private async paginate(
    filter: Record<string, unknown>,
    query: ListOrdersQuery
  ) {
    const sort = parseSort(query.sort);
    const skip = (query.page - 1) * query.pageSize;

    const [items, total] = await Promise.all([
      this.repo.find(filter, sort, skip, query.pageSize),
      this.repo.count(filter),
    ]);

    return buildPaginated({
      items,
      total,
      page: query.page,
      pageSize: query.pageSize,
    });
  }
}
