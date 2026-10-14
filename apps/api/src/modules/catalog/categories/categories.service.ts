import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Types } from "mongoose";
import { CategoriesRepository } from "./categories.repository";
import { CategoryDocument } from "./schemas/category.schema";
import { SlugService } from "../../../common/services/slug.service";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  ListCategoriesQuery,
} from "@baby-shop/shared";
import { buildPaginated } from "../../../common/utils/pagination.util";

@Injectable()
export class CategoriesService {
  constructor(
    private readonly repo: CategoriesRepository,
    private readonly slugs: SlugService
  ) {}

  // ═══════════════════════════════════════════════════════════
  // Create
  // ═══════════════════════════════════════════════════════════

  async create(input: CreateCategoryInput): Promise<CategoryDocument> {
    const slug = await this.slugs.generateUnique(
      this.repo["model"],
      input.name
    );

    if (input.parentId) {
      await this.ensureExists(input.parentId);
    }

    return this.repo.create({
      ...input,
      slug,
      parentId: input.parentId ? new Types.ObjectId(input.parentId) : null,
    });
  }

  // ═══════════════════════════════════════════════════════════
  // Update
  // ═══════════════════════════════════════════════════════════

  async update(
    id: string,
    input: UpdateCategoryInput
  ): Promise<CategoryDocument> {
    const existing = await this.ensureExists(id);

    const patch: Record<string, unknown> = { ...input };

    // Regenerate slug when name changes
    if (input.name && input.name !== existing.name) {
      patch.slug = await this.slugs.generateUnique(
        this.repo["model"],
        input.name,
        id
      );
    }

    // Handle parent changes with cycle detection
    if (input.parentId !== undefined) {
      if (input.parentId === id) {
        throw new BadRequestException({
          code: "CYCLE",
          message: "A category cannot be its own parent",
        });
      }

      if (input.parentId) {
        // Ensure the parent exists
        await this.ensureExists(input.parentId);

        // Ensure the new parent is not a descendant of this category
        await this.assertNoCycle(id, input.parentId);
      }

      patch.parentId = input.parentId
        ? new Types.ObjectId(input.parentId)
        : null;
    }

    // Normalize optional empty strings to undefined so they get cleared
    if (input.icon !== undefined && input.icon === "") {
      patch.icon = undefined;
    }
    if (input.metaTitle !== undefined && input.metaTitle === "") {
      patch.metaTitle = undefined;
    }
    if (input.metaDescription !== undefined && input.metaDescription === "") {
      patch.metaDescription = undefined;
    }
    if (input.ogImage !== undefined && input.ogImage === "") {
      patch.metaDescription = undefined;
    }
    if (input.imageUrl !== undefined && input.imageUrl === "") {
      patch.imageUrl = undefined;
    }

    const updated = await this.repo.updateById(id, patch);
    if (!updated) throw new NotFoundException("Category not found");
    return updated;
  }

  // ═══════════════════════════════════════════════════════════
  // Delete
  // ═══════════════════════════════════════════════════════════

  async remove(id: string): Promise<void> {
    await this.ensureExists(id);

    if (await this.repo.hasChildren(id)) {
      throw new ConflictException({
        code: "HAS_CHILDREN",
        message:
          "Cannot delete a category that has subcategories. Reassign or delete them first.",
      });
    }

    if (await this.repo.hasProducts(id)) {
      throw new ConflictException({
        code: "HAS_PRODUCTS",
        message:
          "Cannot delete a category that has products. Reassign them first.",
      });
    }

    await this.repo.deleteById(id);
  }

  // ═══════════════════════════════════════════════════════════
  // Lookup
  // ═══════════════════════════════════════════════════════════

  async findBySlugOrId(
    slugOrId: string,
    opts: { includeInactive?: boolean } = {}
  ): Promise<CategoryDocument> {
    const doc = Types.ObjectId.isValid(slugOrId)
      ? await this.repo.findById(slugOrId)
      : await this.repo.findBySlug(slugOrId);

    if (!doc) {
      throw new NotFoundException({
        code: "CATEGORY_NOT_FOUND",
        message: "Category not found",
      });
    }

    // Customers should never see inactive categories
    if (!opts.includeInactive && !doc.isActive) {
      throw new NotFoundException({
        code: "CATEGORY_NOT_FOUND",
        message: "Category not found",
      });
    }

    return doc;
  }

  // ═══════════════════════════════════════════════════════════
  // List
  // ═══════════════════════════════════════════════════════════

  async list(
    query: ListCategoriesQuery,
    opts: { includeInactive?: boolean } = {}
  ) {
    const filter: Record<string, unknown> = {};

    if (query.rootOnly) filter.parentId = null;
    if (query.parentId) filter.parentId = new Types.ObjectId(query.parentId);

    // Admin sees everything; customers only see active categories
    if (!opts.includeInactive && !query.includeInactive) {
      filter.isActive = true;
    }

    const [items, total] = await Promise.all([
      this.repo.find(filter),
      this.repo.count(filter),
    ]);

    // Category lists are small — ignore pagination cap and return all
    return buildPaginated({
      items,
      total,
      page: 1,
      pageSize: total || 1,
    });
  }

  // ═══════════════════════════════════════════════════════════
  // Helpers
  // ═══════════════════════════════════════════════════════════

  private async ensureExists(id: string): Promise<CategoryDocument> {
    const cat = await this.repo.findById(id);
    if (!cat) {
      throw new NotFoundException({
        code: "CATEGORY_NOT_FOUND",
        message: "Category not found",
      });
    }
    return cat;
  }

  /**
   * Throws if `maybeDescendantId` is actually a descendant of `ancestorId`.
   * Walks the parent chain upward from `maybeDescendantId`.
   */
  private async assertNoCycle(
    ancestorId: string,
    maybeDescendantId: string
  ): Promise<void> {
    const seen = new Set<string>();
    let cursor: string | null = maybeDescendantId;

    while (cursor && !seen.has(cursor)) {
      if (cursor === ancestorId) {
        throw new BadRequestException({
          code: "CYCLE",
          message:
            "Cannot set a descendant as parent — this would create a cycle.",
        });
      }
      seen.add(cursor);

      const parent = await this.repo.findById(cursor);
      cursor = parent?.parentId ? parent.parentId.toString() : null;
    }
  }
}