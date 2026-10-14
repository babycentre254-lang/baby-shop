import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Types, FilterQuery } from "mongoose";
import { BrandsRepository } from "./brands.repository";
import { BrandDocument } from "./schemas/brand.schema";
import { SlugService } from "../../../common/services/slug.service";
import type {
  CreateBrandInput,
  UpdateBrandInput,
  ListBrandsQuery,
} from "@baby-shop/shared";
import { buildPaginated } from "../../../common/utils/pagination.util";

@Injectable()
export class BrandsService {
  constructor(
    private readonly repo: BrandsRepository,
    private readonly slugs: SlugService
  ) {}

  async create(input: CreateBrandInput): Promise<BrandDocument> {
    const nameExists = await this.repo["model"].findOne({
      name: input.name.trim(),
    });
    if (nameExists) {
      throw new ConflictException({
        code: "BRAND_NAME_TAKEN",
        message: "A brand with this name already exists",
      });
    }

    const slug = await this.slugs.generateUnique(
      this.repo["model"],
      input.name
    );

    return this.repo.create({ ...input, slug });
  }

  async update(id: string, input: UpdateBrandInput): Promise<BrandDocument> {
    const existing = await this.ensureExists(id);
    const patch: Record<string, unknown> = { ...input };

    if (input.name && input.name !== existing.name) {
      patch.slug = await this.slugs.generateUnique(
        this.repo["model"],
        input.name,
        id
      );
    }

    // Normalize empty strings to null so they clear
    if (input.website === "") patch.website = undefined;
    if (input.description === "") patch.description = undefined;
    if (input.logoUrl === "") patch.logoUrl = undefined;
    if (input.metaTitle === "") patch.metaTitle = undefined;
    if (input.metaDescription === "") patch.metaDescription = undefined;
    if (input.ogImage === "") patch.ogImage = undefined;

    const updated = await this.repo.updateById(id, patch);
    if (!updated) throw new NotFoundException("Brand not found");
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.ensureExists(id);
    if (await this.repo.hasProducts(id)) {
      throw new ConflictException({
        code: "HAS_PRODUCTS",
        message:
          "Cannot delete a brand that has products. Reassign them first.",
      });
    }
    await this.repo.deleteById(id);
  }

  async findBySlugOrId(
    slugOrId: string,
    opts: { includeInactive?: boolean } = {}
  ): Promise<BrandDocument> {
    const doc = Types.ObjectId.isValid(slugOrId)
      ? await this.repo.findById(slugOrId)
      : await this.repo.findBySlug(slugOrId);

    if (!doc) {
      throw new NotFoundException({
        code: "BRAND_NOT_FOUND",
        message: "Brand not found",
      });
    }

    if (!opts.includeInactive && !doc.isActive) {
      throw new NotFoundException({
        code: "BRAND_NOT_FOUND",
        message: "Brand not found",
      });
    }

    return doc;
  }

  async list(
    query: ListBrandsQuery,
    opts: { includeInactive?: boolean } = {}
  ) {
    const filter: FilterQuery<BrandDocument> = {};
    if (query.search) {
      filter.name = { $regex: query.search, $options: "i" };
    }
    if (!opts.includeInactive && !query.includeInactive) {
      filter.isActive = true;
    }

    const [items, total] = await Promise.all([
      this.repo.find(filter),
      this.repo.count(filter),
    ]);

    return buildPaginated({
      items,
      total,
      page: 1,
      pageSize: total || 1,
    });
  }

  private async ensureExists(id: string): Promise<BrandDocument> {
    const brand = await this.repo.findById(id);
    if (!brand) {
      throw new NotFoundException({
        code: "BRAND_NOT_FOUND",
        message: "Brand not found",
      });
    }
    return brand;
  }
}