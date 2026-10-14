import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Types } from "mongoose";

import { CartRepository } from "./cart.repository";
import { CartDocument } from "./schemas/cart.schema";
import { ProductsRepository } from "../catalog/products/products.repository";
import { ProductDocument } from "../catalog/products/schemas/product.schema";
import type {
  AddToCartInput,
  UpdateCartItemInput,
} from "@baby-shop/shared";

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export interface HydratedCartItem {
  _id: string;
  variantId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  availableStock: number;
  /** Unit weight in grams. 0 if not set on the product. */
  unitWeightGrams: number;
  product: {
    _id: string;
    name: string;
    slug: string;
    image?: string;
  };
  variant: {
    sku: string;
    size?: string;
    color?: string;
  };
}

export interface HydratedCart {
  _id: string;
  items: HydratedCartItem[];
  subtotal: number;
  itemCount: number;
  /** Sum of (unitWeightGrams × quantity) across all items */
  totalWeightGrams: number;
}

// ═══════════════════════════════════════════════════════════
// Service
// ═══════════════════════════════════════════════════════════

@Injectable()
export class CartService {
  constructor(
    private readonly carts: CartRepository,
    private readonly products: ProductsRepository
  ) {}

  // ═══════════════════════════════════════════════════════════
  // Read
  // ═══════════════════════════════════════════════════════════

  async getCart(userId: string): Promise<HydratedCart> {
    const cart = await this.carts.findByUserOrCreate(userId);
    return this.hydrate(cart);
  }

  // ═══════════════════════════════════════════════════════════
  // Add item
  // ═══════════════════════════════════════════════════════════

  async addItem(
    userId: string,
    input: AddToCartInput
  ): Promise<HydratedCart> {
    const product = await this.products["model"]
      .findOne({ "variants._id": new Types.ObjectId(input.variantId) })
      .exec();

    if (!product) {
      throw new NotFoundException({
        code: "VARIANT_NOT_FOUND",
        message: "Product variant not found",
      });
    }

    const variant = (product.variants as any[]).find(
      (v) => v._id.toString() === input.variantId
    );

    if (!variant) {
      throw new NotFoundException({
        code: "VARIANT_NOT_FOUND",
        message: "Variant not found on product",
      });
    }

    if (variant.stock < input.quantity) {
      throw new BadRequestException({
        code: "INSUFFICIENT_STOCK",
        message: `Only ${variant.stock} in stock`,
        details: { available: variant.stock },
      });
    }

    const cart = await this.carts.findByUserOrCreate(userId);

    const existingIdx = cart.items.findIndex(
      (it) => it.variantId.toString() === input.variantId
    );

    if (existingIdx >= 0) {
      const newQty = cart.items[existingIdx].quantity + input.quantity;
      if (newQty > variant.stock) {
        throw new BadRequestException({
          code: "INSUFFICIENT_STOCK",
          message: `Only ${variant.stock} in stock`,
          details: { available: variant.stock },
        });
      }
      cart.items[existingIdx].quantity = newQty;
    } else {
      cart.items.push({
        variantId: new Types.ObjectId(input.variantId),
        productId: product._id,
        quantity: input.quantity,
      } as any);
    }

    await cart.save();
    return this.hydrate(cart);
  }

  // ═══════════════════════════════════════════════════════════
  // Update quantity
  // ═══════════════════════════════════════════════════════════

  async updateItem(
    userId: string,
    itemId: string,
    input: UpdateCartItemInput
  ): Promise<HydratedCart> {
    const cart = await this.carts.findByUserOrCreate(userId);
    const item = cart.items.find((it) => it._id.toString() === itemId);
    if (!item) {
      throw new NotFoundException({
        code: "CART_ITEM_NOT_FOUND",
        message: "Cart item not found",
      });
    }

    const product = await this.products["model"]
      .findOne({ "variants._id": item.variantId })
      .exec();
    const variant = (product?.variants as any[] | undefined)?.find(
      (v) => v._id.toString() === item.variantId.toString()
    );

    if (!variant || variant.stock < input.quantity) {
      throw new BadRequestException({
        code: "INSUFFICIENT_STOCK",
        message: `Only ${variant?.stock ?? 0} in stock`,
        details: { available: variant?.stock ?? 0 },
      });
    }

    item.quantity = input.quantity;
    await cart.save();
    return this.hydrate(cart);
  }

  // ═══════════════════════════════════════════════════════════
  // Remove item
  // ═══════════════════════════════════════════════════════════

  async removeItem(
    userId: string,
    itemId: string
  ): Promise<HydratedCart> {
    const cart = await this.carts.findByUserOrCreate(userId);
    const before = cart.items.length;
    cart.items = cart.items.filter((it) => it._id.toString() !== itemId);
    if (cart.items.length === before) {
      throw new NotFoundException({
        code: "CART_ITEM_NOT_FOUND",
        message: "Cart item not found",
      });
    }
    await cart.save();
    return this.hydrate(cart);
  }

  // ═══════════════════════════════════════════════════════════
  // Clear
  // ═══════════════════════════════════════════════════════════

  async clear(userId: string): Promise<void> {
    const cart = await this.carts.findByUserOrCreate(userId);
    cart.items = [];
    await cart.save();
  }

  /** Used by checkout — returns raw cart doc (not hydrated) */
  async getRawCart(userId: string): Promise<CartDocument> {
    const cart = await this.carts.findByUserOrCreate(userId);
    if (!cart.items.length) {
      throw new BadRequestException({
        code: "EMPTY_CART",
        message: "Your cart is empty",
      });
    }
    return cart;
  }

  // ═══════════════════════════════════════════════════════════
  // Merge (guest → authenticated)
  // ═══════════════════════════════════════════════════════════

  async mergeItems(
    userId: string,
    items: { variantId: string; quantity: number }[]
  ): Promise<HydratedCart> {
    if (!items.length) return this.getCart(userId);

    const cart = await this.carts.findByUserOrCreate(userId);

    for (const incoming of items) {
      if (!Types.ObjectId.isValid(incoming.variantId)) continue;

      const product = await this.products["model"]
        .findOne({ "variants._id": new Types.ObjectId(incoming.variantId) })
        .exec();
      if (!product) continue;

      const variant = (product.variants as any[]).find(
        (v) => v._id.toString() === incoming.variantId
      );
      if (!variant || variant.stock <= 0) continue;

      const existingIdx = cart.items.findIndex(
        (it) => it.variantId.toString() === incoming.variantId
      );

      if (existingIdx >= 0) {
        const merged =
          cart.items[existingIdx].quantity + incoming.quantity;
        cart.items[existingIdx].quantity = Math.min(
          merged,
          variant.stock
        );
      } else {
        cart.items.push({
          variantId: new Types.ObjectId(incoming.variantId),
          productId: product._id,
          quantity: Math.min(incoming.quantity, variant.stock),
        } as any);
      }
    }

    await cart.save();
    return this.hydrate(cart);
  }

  /** Clears a cart by user id — used post-checkout */
  async clearByUser(userId: string): Promise<void> {
    await this.carts.deleteByUser(userId);
  }

  // ═══════════════════════════════════════════════════════════
  // Hydrate — expands cart items with product/variant data
  // ═══════════════════════════════════════════════════════════

  private async hydrate(cart: CartDocument): Promise<HydratedCart> {
    if (!cart.items.length) {
      return {
        _id: cart._id.toString(),
        items: [],
        subtotal: 0,
        itemCount: 0,
        totalWeightGrams: 0,
      };
    }

    const productIds = [
      ...new Set(cart.items.map((it) => it.productId.toString())),
    ];
    const products = await this.products["model"]
      .find({ _id: { $in: productIds.map((id) => new Types.ObjectId(id)) } })
      .exec();

    const productMap = new Map<string, ProductDocument>(
      products.map((p) => [p._id.toString(), p])
    );

    const items: HydratedCartItem[] = [];
    let subtotal = 0;
    let itemCount = 0;
    let totalWeightGrams = 0;

    for (const item of cart.items) {
      const product = productMap.get(item.productId.toString());
      if (!product) continue;

      const variant = (product.variants as any[]).find(
        (v) => v._id.toString() === item.variantId.toString()
      );
      if (!variant) continue;

      const unitPrice =
        product.salePrice ?? variant.price ?? product.basePrice;
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;
      itemCount += item.quantity;

      const unitWeightGrams = Number((product as any).weightGrams ?? 0);
      totalWeightGrams += unitWeightGrams * item.quantity;

      items.push({
        _id: item._id.toString(),
        variantId: item.variantId.toString(),
        productId: item.productId.toString(),
        quantity: item.quantity,
        unitPrice,
        lineTotal,
        availableStock: variant.stock,
        unitWeightGrams,
        product: {
          _id: product._id.toString(),
          name: product.name,
          slug: product.slug,
          image: product.images?.[0]?.url,
        },
        variant: {
          sku: variant.sku,
          size: variant.size,
          color: variant.color,
        },
      });
    }

    return {
      _id: cart._id.toString(),
      items,
      subtotal,
      itemCount,
      totalWeightGrams,
    };
  }
}