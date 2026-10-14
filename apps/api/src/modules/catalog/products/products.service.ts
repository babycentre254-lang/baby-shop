import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { FilterQuery, Types } from "mongoose";

import { ProductsRepository } from "./products.repository";
import { ProductDocument } from "./schemas/product.schema";
import { CategoriesRepository } from "../categories/categories.repository";
import { BrandsRepository } from "../brands/brands.repository";
import { SlugService } from "../../../common/services/slug.service";
import { buildPaginated, parseSort } from "../../../common/utils/pagination.util";
import type {
  CreateProductInput,
  UpdateProductInput,
  ListProductsQuery,
  AddProductImagesInput,
} from "@baby-shop/shared";

@Injectable()
export class ProductsService {
  constructor(
    private readonly repo: ProductsRepository,
    private readonly categories: CategoriesRepository,
    private readonly brands: BrandsRepository,
    private readonly slugs: SlugService
  ) {}

  async create(input: CreateProductInput): Promise<ProductDocument> {
    const category = await this.categories.findById(input.categoryId);
    if (!category) {
      throw new BadRequestException({
        code: "CATEGORY_NOT_FOUND",
        message: "Category does not exist",
      });
    }

    if (input.brandId) {
      const brand = await this.brands.findById(input.brandId);
      if (!brand) {
        throw new BadRequestException({
          code: "BRAND_NOT_FOUND",
          message: "Brand does not exist",
        });
      }
    }

    const skuExists = await this.repo.findBySku(input.sku);
    if (skuExists) {
      throw new ConflictException({
        code: "SKU_TAKEN",
        message: `SKU "${input.sku}" is already in use`,
      });
    }

    this.assertUniqueVariantSkus(input);

    const slug = await this.slugs.generateUnique(this.repo["model"], input.name);

    return this.repo.create({
      ...input,
      slug,
      categoryId: new Types.ObjectId(input.categoryId),
      brandId: input.brandId ? new Types.ObjectId(input.brandId) : null,
      images: input.images ?? [],
      variants: input.variants ?? [],
    });
  }

  async update(
    id: string,
    input: UpdateProductInput
  ): Promise<ProductDocument> {
    const existing = await this.ensureExists(id);
    const patch: Record<string, unknown> = { ...input };

    if (input.categoryId) {
      const category = await this.categories.findById(input.categoryId);
      if (!category) {
        throw new BadRequestException({
          code: "CATEGORY_NOT_FOUND",
          message: "Category does not exist",
        });
      }
      patch.categoryId = new Types.ObjectId(input.categoryId);
    }

    if (input.brandId !== undefined) {
      if (input.brandId) {
        const brand = await this.brands.findById(input.brandId);
        if (!brand) {
          throw new BadRequestException({
            code: "BRAND_NOT_FOUND",
            message: "Brand does not exist",
          });
        }
        patch.brandId = new Types.ObjectId(input.brandId);
      } else {
        patch.brandId = null;
      }
    }

    if (input.name && input.name !== existing.name) {
      patch.slug = await this.slugs.generateUnique(
        this.repo["model"],
        input.name,
        id
      );
    }

    if (input.variants) this.assertUniqueVariantSkus(input as any);

    const updated = await this.repo.updateById(id, patch);
    if (!updated) throw new NotFoundException("Product not found");
    return updated;
  }

  async updateInventory(id: string, changes: { variantId: string; stock: number }[]): Promise<ProductDocument> {
    const product = await this.ensureExists(id);
    const updates = new Map(changes.map((change) => [change.variantId, change.stock]));
    const variants = (product.variants ?? []).map((variant: any) => {
      const plain = typeof variant.toObject === "function" ? variant.toObject() : { ...variant };
      const variantId = plain._id?.toString?.() ?? "";
      if (updates.has(variantId)) {
        plain.stock = updates.get(variantId);
        updates.delete(variantId);
      }
      return plain;
    });
    if (updates.size) {
      throw new BadRequestException({ code: "VARIANT_NOT_FOUND", message: "One or more variants do not belong to this product." });
    }
    const updated = await this.repo.updateById(id, { variants });
    if (!updated) throw new NotFoundException("Product not found");
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.ensureExists(id);
    await this.repo.deleteById(id);
  }

  async findBySlugOrId(
    slugOrId: string,
    opts: { includeUnpublished?: boolean } = {}
  ): Promise<ProductDocument> {
    const doc = Types.ObjectId.isValid(slugOrId)
      ? await this.repo.findById(slugOrId)
      : await this.repo.findBySlug(slugOrId);

    if (!doc) {
      throw new NotFoundException({
        code: "PRODUCT_NOT_FOUND",
        message: "Product not found",
      });
    }

    if (!opts.includeUnpublished && !doc.isPublished) {
      throw new NotFoundException({
        code: "PRODUCT_NOT_FOUND",
        message: "Product not found",
      });
    }
    return doc;
  }

  async list(query: ListProductsQuery, opts: { isAdmin?: boolean } = {}) {
    const filter = await this.buildFilter(query, opts);
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

  async addImages(
    id: string,
    input: AddProductImagesInput
  ): Promise<ProductDocument> {
    const product = await this.ensureExists(id);
    const merged = [...(product.images ?? []), ...input.images];
    const updated = await this.repo.updateById(id, { images: merged });
    if (!updated) throw new NotFoundException("Product not found");
    return updated;
  }

  async removeImage(id: string, imageId: string): Promise<ProductDocument> {
    const product = await this.ensureExists(id);
    const filtered = (product.images ?? []).filter(
      (img: any) => img._id?.toString() !== imageId
    );
    if (filtered.length === product.images.length) {
      throw new NotFoundException({
        code: "IMAGE_NOT_FOUND",
        message: "Image does not exist on this product",
      });
    }
    const updated = await this.repo.updateById(id, { images: filtered });
    if (!updated) throw new NotFoundException("Product not found");
    return updated;
  }

  private async ensureExists(id: string): Promise<ProductDocument> {
    const product = await this.repo.findById(id);
    if (!product) {
      throw new NotFoundException({
        code: "PRODUCT_NOT_FOUND",
        message: "Product not found",
      });
    }
    return product;
  }

  private assertUniqueVariantSkus(input: { variants?: { sku: string }[] }) {
    const skus = (input.variants ?? []).map((v) => v.sku);
    const dupes = skus.filter((s, i) => skus.indexOf(s) !== i);
    if (dupes.length) {
      throw new BadRequestException({
        code: "DUPLICATE_VARIANT_SKU",
        message: `Duplicate variant SKUs: ${[...new Set(dupes)].join(", ")}`,
      });
    }
  }

  private async buildFilter(
    query: ListProductsQuery,
    opts: { isAdmin?: boolean }
  ): Promise<FilterQuery<ProductDocument>> {
    const filter: FilterQuery<ProductDocument> = {};

    if (!opts.isAdmin || query.published) filter.isPublished = true;
    if (query.featured) filter.isFeatured = true;

    if (query.categoryId) {
      filter.categoryId = new Types.ObjectId(query.categoryId);
    } else if (query.categorySlug) {
      const cat = await this.categories.findBySlug(query.categorySlug);
      if (!cat) return { _id: { $exists: false } }; // no results
      filter.categoryId = cat._id;
    }

    if (query.brandId) {
      filter.brandId = new Types.ObjectId(query.brandId);
    } else if (query.brandSlug) {
      const brand = await this.brands.findBySlug(query.brandSlug);
      if (!brand) return { _id: { $exists: false } };
      filter.brandId = brand._id;
    }

    if (query.ageRange) filter.ageRange = query.ageRange;

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      const priceFilter: Record<string, number> = {};
      if (query.minPrice !== undefined) priceFilter.$gte = query.minPrice;
      if (query.maxPrice !== undefined) priceFilter.$lte = query.maxPrice;
      filter.basePrice = priceFilter;
    }

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: "i" } },
        { description: { $regex: query.search, $options: "i" } },
        { sku: { $regex: query.search, $options: "i" } },
      ];
    }

    return filter;
  }
}
