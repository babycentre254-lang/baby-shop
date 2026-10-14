import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { ORDER_STATUS, ROLES } from "@baby-shop/shared";
import { UsersRepository } from "../users/users.repository";
import { UsersService } from "../users/users.service";
import { Order, OrderDocument } from "../orders/schemas/order.schema";
import { Product } from "../catalog/products/schemas/product.schema";
import { Branch, BranchDocument } from "./schemas/branch.schema";
import { DraftOrder, DraftOrderDocument } from "./schemas/draft-order.schema";
import { StoreSettings, StoreSettingsDocument } from "./schemas/store-settings.schema";
import { adminSaleSchema, createBranchSchema, draftOrderSchema, listAdminQuerySchema, staffSchema, storeSettingsSchema, updateBranchSchema, updateStaffAccessSchema } from "./admin.schemas";
import type { z } from "zod";

type ListQuery = z.infer<typeof listAdminQuerySchema>;
@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Order.name) private readonly orders: Model<OrderDocument>,
    @InjectModel(Product.name) private readonly products: Model<any>,
    @InjectModel(Branch.name) private readonly branches: Model<BranchDocument>,
    @InjectModel(DraftOrder.name) private readonly drafts: Model<DraftOrderDocument>,
    @InjectModel(StoreSettings.name) private readonly settings: Model<StoreSettingsDocument>,
    private readonly usersRepo: UsersRepository,
    private readonly users: UsersService,
  ) {}

  async analytics(days = 30) {
    const safeDays = [7, 30, 90].includes(days) ? days : 30;
    const start = new Date(); start.setUTCHours(0, 0, 0, 0); start.setUTCDate(start.getUTCDate() - safeDays + 1);
    const previousStart = new Date(start); previousStart.setUTCDate(previousStart.getUTCDate() - safeDays);
    const paidStatuses = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"];
    const [report, customerCount, productCount, pendingOrders, lowStockProducts, lowStockResult, storeSettings] = await Promise.all([
      this.orders.aggregate([
        { $facet: {
          current: [
            { $match: { createdAt: { $gte: start } } },
            { $group: { _id: null, orderCount: { $sum: 1 }, revenue: { $sum: { $cond: [{ $in: ["$status", paidStatuses] }, "$total", 0] } } } },
          ],
          previous: [
            { $match: { createdAt: { $gte: previousStart, $lt: start } } },
            { $group: { _id: null, orderCount: { $sum: 1 }, revenue: { $sum: { $cond: [{ $in: ["$status", paidStatuses] }, "$total", 0] } } } },
          ],
          dailySales: [
            { $match: { createdAt: { $gte: start } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" } }, revenue: { $sum: { $cond: [{ $in: ["$status", paidStatuses] }, "$total", 0] } }, orders: { $sum: 1 } } },
            { $sort: { _id: 1 } },
          ],
          orderStatuses: [
            { $match: { createdAt: { $gte: start } } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
          ],
          topProducts: [
            { $match: { createdAt: { $gte: start }, status: { $in: paidStatuses } } },
            { $unwind: "$items" },
            { $group: { _id: "$items.productName", units: { $sum: "$items.quantity" }, revenue: { $sum: "$items.lineTotal" } } },
            { $sort: { units: -1 } }, { $limit: 5 },
          ],
          recentOrders: [
            { $sort: { createdAt: -1 } }, { $limit: 6 },
            { $project: { orderNumber: 1, status: 1, total: 1, createdAt: 1, paymentProvider: 1 } },
          ],
        } },
      ]).exec(),
      this.usersRepo.count({ role: ROLES.CUSTOMER }),
      this.products.countDocuments().exec(),
      this.orders.countDocuments({ status: "PENDING" }).exec(),
      this.products.aggregate([
        { $unwind: "$variants" },
        { $match: { $expr: { $lte: ["$variants.stock", "$variants.lowStockAt"] } } },
        { $group: { _id: "$_id", name: { $first: "$name" }, slug: { $first: "$slug" }, image: { $first: { $arrayElemAt: ["$images.url", 0] } }, stock: { $sum: "$variants.stock" }, lowStockVariants: { $sum: 1 } } },
        { $sort: { stock: 1, name: 1 } }, { $limit: 5 },
      ]).exec(),
      this.products.aggregate([
        { $unwind: "$variants" },
        { $match: { $expr: { $lte: ["$variants.stock", "$variants.lowStockAt"] } } },
        { $count: "count" },
      ]).exec(),
      this.settings.findOne().select("currency storeName").lean().exec(),
    ]);
    const result = report[0] ?? {};
    const current = result.current?.[0] ?? { orderCount: 0, revenue: 0 };
    const previous = result.previous?.[0] ?? { orderCount: 0, revenue: 0 };
    const byDate = new Map((result.dailySales ?? []).map((row: any) => [row._id, row]));
    const dailySales = Array.from({ length: safeDays }, (_, i) => {
      const date = new Date(start); date.setUTCDate(start.getUTCDate() + i);
      const key = date.toISOString().slice(0, 10); const row: any = byDate.get(key);
      return { date: key, revenue: row?.revenue ?? 0, orders: row?.orders ?? 0 };
    });
    const percentChange = (value: number, previousValue: number): number | null => {
      if (previousValue === 0) return value === 0 ? 0 : null;
      return Math.round(((value - previousValue) / previousValue) * 100);
    };
    return {
      summary: {
        orderCount: current.orderCount,
        customerCount,
        productCount,
        pendingOrders,
        revenue: current.revenue,
        revenueChangePercent: percentChange(current.revenue, previous.revenue),
        orderChangePercent: percentChange(current.orderCount, previous.orderCount),
        lowStockVariants: lowStockResult[0]?.count ?? 0,
      },
      currency: storeSettings?.currency ?? "KES",
      storeName: storeSettings?.storeName ?? "Baby Shop",
      dailySales,
      orderStatuses: (result.orderStatuses ?? []).map((row: any) => ({ status: row._id, count: row.count })),
      recentOrders: result.recentOrders ?? [],
      topProducts: result.topProducts ?? [],
      lowStockProducts,
      rangeDays: safeDays,
    };
  }

  async listCustomers(query: ListQuery) {
    const result = await this.listUsers(query, ROLES.CUSTOMER);
    const customerFilter: any = { role: ROLES.CUSTOMER, deletedAt: null };
    if (query.search) customerFilter.$or = [
      { firstName: { $regex: escapeRegex(query.search), $options: "i" } },
      { lastName: { $regex: escapeRegex(query.search), $options: "i" } },
      { email: { $regex: escapeRegex(query.search), $options: "i" } },
      { phone: { $regex: escapeRegex(query.search), $options: "i" } },
    ];
    if (query.verified !== undefined) customerFilter.isEmailVerified = query.verified;
    const [verified, newLast30Days] = await Promise.all([
      this.usersRepo["model"].countDocuments({ ...customerFilter, isEmailVerified: true }).exec(),
      this.usersRepo["model"].countDocuments({ ...customerFilter, createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }).exec(),
    ]);
    return { ...result, stats: { total: result.total, verified, unverified: result.total - verified, newLast30Days } };
  }

  async getCustomerDetails(id: string) {
    const customer: any = await this.usersRepo.findById(id);
    if (!customer || customer.role !== ROLES.CUSTOMER) throw new NotFoundException({ code: "CUSTOMER_NOT_FOUND", message: "Customer not found." });
    const userId = new Types.ObjectId(id);
    const [orders, orderCount, paidSummary] = await Promise.all([
      this.orders.find({ userId, salesChannel: { $ne: "POS" } }).sort({ createdAt: -1 }).select("orderNumber status total paymentProvider createdAt items").limit(12).lean().exec(),
      this.orders.countDocuments({ userId, salesChannel: { $ne: "POS" } }).exec(),
      this.orders.aggregate([{ $match: { userId, salesChannel: { $ne: "POS" }, status: { $in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] } } }, { $group: { _id: null, count: { $sum: 1 }, totalSpent: { $sum: "$total" } } }]).exec(),
    ]);
    return {
      customer: { _id: customer._id, firstName: customer.firstName, lastName: customer.lastName, email: customer.email, phone: customer.phone, isEmailVerified: customer.isEmailVerified, createdAt: customer.createdAt },
      summary: { totalOrders: orderCount, paidOrders: paidSummary[0]?.count ?? 0, totalSpent: paidSummary[0]?.totalSpent ?? 0, latestOrderAt: orders[0]?.createdAt ?? null },
      orders: orders.map((order: any) => ({ _id: order._id, orderNumber: order.orderNumber, status: order.status, total: order.total, paymentProvider: order.paymentProvider, createdAt: order.createdAt, itemCount: (order.items ?? []).reduce((count: number, item: any) => count + item.quantity, 0) })),
    };
  }
  async listStaff(query: ListQuery) { return this.listUsers(query, { $in: [ROLES.ADMIN, ROLES.SUPER_ADMIN] }); }
  private async listUsers(query: ListQuery, role: unknown) {
    const filter: any = { role, deletedAt: null };
    if (query.search) filter.$or = [
      { firstName: { $regex: escapeRegex(query.search), $options: "i" } },
      { lastName: { $regex: escapeRegex(query.search), $options: "i" } },
      { email: { $regex: escapeRegex(query.search), $options: "i" } },
      { phone: { $regex: escapeRegex(query.search), $options: "i" } },
    ];
    if (role === ROLES.CUSTOMER && query.verified !== undefined) filter.isEmailVerified = query.verified;
    const [items, total] = await Promise.all([
      this.usersRepo["model"].find(filter).sort({ createdAt: -1 }).skip((query.page - 1) * query.pageSize).limit(query.pageSize).exec(),
      this.usersRepo["model"].countDocuments(filter).exec(),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize, totalPages: Math.ceil(total / query.pageSize) };
  }

  async createStaff(input: z.infer<typeof staffSchema>) {
    const found = await this.usersRepo.findByEmail(input.email);
    if (found) throw new BadRequestException({ code: "EMAIL_TAKEN", message: "An account with this email already exists" });
    const passwordHash = await this.users.hashPassword(input.password);
    return this.usersRepo.create({ firstName: input.firstName, lastName: input.lastName, email: input.email.toLowerCase(), passwordHash, role: ROLES.ADMIN, permissions: input.permissions as any, isEmailVerified: true, emailVerifiedAt: new Date() });
  }
  async updateStaffAccess(id: string, actorId: string, input: z.infer<typeof updateStaffAccessSchema>) {
    if (id === actorId) throw new BadRequestException({ code: "CANNOT_CHANGE_OWN_ACCESS", message: "You cannot change your own role or permissions" });
    const member = await this.usersRepo.findById(id);
    if (!member || (member.role !== ROLES.ADMIN && member.role !== ROLES.SUPER_ADMIN)) throw new NotFoundException({ code: "STAFF_NOT_FOUND", message: "Staff member not found" });
    const resultingRole = input.role ?? member.role;
    const resultingPermissions = input.permissions ?? member.permissions ?? [];
    if (resultingRole === ROLES.ADMIN && resultingPermissions.length === 0) {
      throw new BadRequestException({ code: "ADMIN_REQUIRES_PERMISSION", message: "Assign at least one permission before saving this account as an admin." });
    }
    if (member.role === ROLES.SUPER_ADMIN && input.role === ROLES.ADMIN) {
      const superAdmins = await this.usersRepo.count({ role: ROLES.SUPER_ADMIN });
      if (superAdmins <= 1) throw new BadRequestException({ code: "LAST_SUPER_ADMIN", message: "At least one super admin must remain." });
    }
    return this.usersRepo.updateById(id, {
      ...(input.role ? { role: input.role } : {}),
      ...(input.permissions !== undefined ? { permissions: input.permissions } : {}),
    });
  }

  async listBranches() { return this.branches.find().sort({ name: 1 }).exec(); }
  async createBranch(input: z.infer<typeof createBranchSchema>) { return this.branches.create({ ...input, code: input.code.toUpperCase() }); }
  async updateBranch(id: string, input: z.infer<typeof updateBranchSchema>) {
    const update = { ...input, ...(input.code ? { code: input.code.toUpperCase() } : {}) };
    const result = await this.branches.findByIdAndUpdate(id, update, { new: true, runValidators: true }).exec();
    if (!result) throw new NotFoundException({ code: "BRANCH_NOT_FOUND", message: "Branch not found" });
    return result;
  }
  async removeBranch(id: string) {
    const result = await this.branches.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException({ code: "BRANCH_NOT_FOUND", message: "Branch not found" });
  }

  async getSettings() { return (await this.settings.findOne().exec()) ?? this.settings.create({}); }
  async getCheckoutOptions() {
    const settings = await this.settings.findOne().select("cashOnDeliveryEnabled").lean().exec();
    return { cashOnDeliveryEnabled: settings?.cashOnDeliveryEnabled ?? true };
  }
  async updateSettings(input: z.infer<typeof storeSettingsSchema>) {
    return this.settings.findOneAndUpdate({}, input, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }).exec();
  }

  async listDrafts(query: ListQuery) {
    const filter: any = {};
    if (query.search) filter.$or = [
      { draftNumber: { $regex: escapeRegex(query.search), $options: "i" } },
      { customerName: { $regex: escapeRegex(query.search), $options: "i" } },
      { customerEmail: { $regex: escapeRegex(query.search), $options: "i" } },
    ];
    const [items, total] = await Promise.all([
      this.drafts.find(filter).sort({ updatedAt: -1 }).skip((query.page - 1) * query.pageSize).limit(query.pageSize).exec(),
      this.drafts.countDocuments(filter).exec(),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize, totalPages: Math.ceil(total / query.pageSize) };
  }
  async createDraft(input: z.infer<typeof draftOrderSchema>, userId: string) {
    const total = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const draftNumber = `DR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    return this.drafts.create({ ...input, subtotal: total, draftNumber, createdBy: new Types.ObjectId(userId) });
  }
  async updateDraft(id: string, input: z.infer<typeof draftOrderSchema>) {
    const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const result = await this.drafts.findByIdAndUpdate(id, { ...input, subtotal }, { new: true, runValidators: true }).exec();
    if (!result) throw new NotFoundException({ code: "DRAFT_NOT_FOUND", message: "Draft order not found" });
    return result;
  }
  async removeDraft(id: string) {
    if (!(await this.drafts.findByIdAndDelete(id).exec())) throw new NotFoundException({ code: "DRAFT_NOT_FOUND", message: "Draft order not found" });
  }

  async posProducts(search: string) {
    const filter: any = { isPublished: true };
    if (search) filter.$or = [
      { name: { $regex: escapeRegex(search), $options: "i" } },
      { sku: { $regex: escapeRegex(search), $options: "i" } },
      { "variants.sku": { $regex: escapeRegex(search), $options: "i" } },
    ];
    const products = await this.products.find(filter).select("name slug images variants").sort({ name: 1 }).limit(30).lean().exec();
    return { items: products.map((product: any) => ({ _id: product._id, name: product.name, image: product.images?.[0]?.url, variants: (product.variants ?? []).map((variant: any) => ({ _id: variant._id, sku: variant.sku, size: variant.size, color: variant.color, price: variant.price, stock: variant.stock })) })) };
  }

  async createPosSale(input: z.infer<typeof adminSaleSchema>, actorId: string) {
    const grouped = new Map<string, number>();
    for (const line of input.items) grouped.set(line.variantId, (grouped.get(line.variantId) ?? 0) + line.quantity);
    const variants = [...grouped.entries()];
    const products = await this.products.find({ "variants._id": { $in: variants.map(([id]) => new Types.ObjectId(id)) } }).exec();
    const snapshots: any[] = [];
    let subtotal = 0;
    for (const [variantId, quantity] of variants) {
      const product: any = products.find((candidate: any) => candidate.variants.some((variant: any) => variant._id.toString() === variantId));
      const variant = product?.variants.find((candidate: any) => candidate._id.toString() === variantId);
      if (!product || !variant) throw new BadRequestException({ code: "POS_VARIANT_NOT_FOUND", message: "A selected product option is no longer available." });
      if (variant.stock < quantity) throw new BadRequestException({ code: "INSUFFICIENT_STOCK", message: `${product.name} has only ${variant.stock} in stock.` });
      const unitPrice = Number(variant.price);
      subtotal += unitPrice * quantity;
      snapshots.push({ productId: product._id, variantId: variant._id, productName: product.name, productSlug: product.slug, image: product.images?.[0]?.url, sku: variant.sku, size: variant.size, color: variant.color, unitPrice, quantity, lineTotal: unitPrice * quantity, unitWeightGrams: 0 });
    }
    const updated: Array<{ productId: Types.ObjectId; variantId: Types.ObjectId; quantity: number }> = [];
    try {
      for (const [variantId, quantity] of variants) {
        const result = await this.products.updateOne({ "variants._id": new Types.ObjectId(variantId), variants: { $elemMatch: { _id: new Types.ObjectId(variantId), stock: { $gte: quantity } } } }, { $inc: { "variants.$.stock": -quantity } }).exec();
        if (result.modifiedCount !== 1) throw new BadRequestException({ code: "INSUFFICIENT_STOCK", message: "Stock changed while creating this sale. Refresh and try again." });
        const product = products.find((candidate: any) => candidate.variants.some((variant: any) => variant._id.toString() === variantId))!;
        updated.push({ productId: product._id, variantId: new Types.ObjectId(variantId), quantity });
      }
      const status = input.paymentMethod === "CASH" ? ORDER_STATUS.DELIVERED : ORDER_STATUS.PENDING;
      const order = await this.orders.create({
        orderNumber: await this.generateOrderNumber(), salesChannel: "POS", userId: new Types.ObjectId(actorId), status,
        paymentProvider: input.paymentMethod === "CASH" ? "COD" : "MPESA", subtotal, shippingFee: 0, discount: 0, total: subtotal,
        shippingAddress: { fullName: input.customerName, phone: input.customerPhone || "N/A", county: "In-store", town: "In-store", street: "In-store sale", notes: input.notes },
        items: snapshots, statusHistory: [{ status, at: new Date(), by: new Types.ObjectId(actorId), note: input.paymentMethod === "CASH" ? "In-store cash sale completed and delivered" : "In-store sale awaiting M-Pesa payment" }], notes: input.notes,
      });
      return { order };
    } catch (error) {
      for (const line of updated) await this.products.updateOne({ "variants._id": line.variantId }, { $inc: { "variants.$.stock": line.quantity } }).exec();
      throw error;
    }
  }

  private async generateOrderNumber() {
    const now = new Date();
    const yyyy = now.getUTCFullYear();
    const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(now.getUTCDate()).padStart(2, "0");
    const start = new Date(Date.UTC(yyyy, now.getUTCMonth(), now.getUTCDate()));
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    const count = await this.orders.countDocuments({ createdAt: { $gte: start, $lt: end } }).exec();
    return `BS-${yyyy}${mm}${dd}-${String(count + 1).padStart(5, "0")}`;
  }
}

function escapeRegex(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

