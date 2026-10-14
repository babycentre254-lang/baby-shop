import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ShippingRepository } from "./shipping.repository";
import { ShippingZoneDocument } from "./schemas/shipping-zone.schema";
import { buildPaginated } from "../../common/utils/pagination.util";
import type {
  CreateShippingZoneInput,
  UpdateShippingZoneInput,
  ListShippingZonesQuery,
  CalculateShippingInput,
} from "@baby-shop/shared";
import type { ShippingQuote } from "@baby-shop/shared";
import { KENYAN_COUNTIES } from "@baby-shop/shared";

/**
 * Fallback when a county isn't in the DB. Very high fee so admins notice.
 */
const FALLBACK_ZONE = {
  baseFee: 800,
  includedGrams: 3000,
  additionalPerKg: 150,
  label: "Other counties",
  etaText: "3-5 business days",
};

@Injectable()
export class ShippingService {
  constructor(private readonly repo: ShippingRepository) {}

  // ═══════════════════════════════════════════════════════════
  // Admin CRUD
  // ═══════════════════════════════════════════════════════════

  async list(
    query: ListShippingZonesQuery,
    opts: { includeInactive?: boolean } = {}
  ) {
    const filter: Record<string, unknown> = {};
    if (query.county) {
      filter.county = { $regex: query.county, $options: "i" };
    }
    if (!opts.includeInactive) {
      filter.isActive = true;
    } else if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
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

  async getOne(id: string): Promise<ShippingZoneDocument> {
    const doc = await this.repo.findById(id);
    if (!doc) {
      throw new NotFoundException({
        code: "SHIPPING_ZONE_NOT_FOUND",
        message: "Shipping zone not found",
      });
    }
    return doc;
  }

  async create(
    input: CreateShippingZoneInput
  ): Promise<ShippingZoneDocument> {
    const county = this.normalizeCounty(input.county);
    const existing = await this.repo["model"].findOne({ county: { $regex: `^${this.escapeRegex(county)}$`, $options: "i" } });
    if (existing) {
      throw new ConflictException({
        code: "SHIPPING_ZONE_EXISTS",
        message: `A shipping zone for "${input.county}" already exists`,
      });
    }
    return this.repo.create({ ...input, county });
  }

  async update(
    id: string,
    input: UpdateShippingZoneInput
  ): Promise<ShippingZoneDocument> {
    await this.getOne(id);
    const normalized = input.county ? { ...input, county: this.normalizeCounty(input.county) } : input;
    if (normalized.county) {
      const duplicate = await this.repo["model"].findOne({
        _id: { $ne: id },
        county: { $regex: `^${this.escapeRegex(normalized.county)}$`, $options: "i" },
      });
      if (duplicate) {
        throw new ConflictException({ code: "SHIPPING_ZONE_EXISTS", message: `A shipping zone for "${normalized.county}" already exists` });
      }
    }
    const updated = await this.repo.updateById(id, normalized);
    if (!updated) throw new NotFoundException("Shipping zone not found");
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.getOne(id);
    await this.repo.deleteById(id);
  }

  // ═══════════════════════════════════════════════════════════
  // Public: quote calculation
  // ═══════════════════════════════════════════════════════════

  async quote(input: CalculateShippingInput): Promise<ShippingQuote> {
    const zone = await this.repo.findByCounty(input.county);

    const base = zone
      ? {
          zoneId: zone._id.toString(),
          label: zone.label ?? zone.county,
          etaText: zone.etaText,
          baseFee: zone.baseFee,
          includedGrams: zone.includedGrams,
          additionalPerKg: zone.additionalPerKg,
          isFallback: false,
        }
      : {
          zoneId: null,
          label: FALLBACK_ZONE.label,
          etaText: FALLBACK_ZONE.etaText,
          baseFee: FALLBACK_ZONE.baseFee,
          includedGrams: FALLBACK_ZONE.includedGrams,
          additionalPerKg: FALLBACK_ZONE.additionalPerKg,
          isFallback: true,
        };

    const additionalGrams = Math.max(
      0,
      input.totalWeightGrams - base.includedGrams
    );
    const additionalKg = Math.ceil(additionalGrams / 1000);
    const additionalFee = additionalKg * base.additionalPerKg;

    return {
      county: input.county,
      zoneId: base.zoneId,
      zoneLabel: base.label,
      etaText: base.etaText,
      totalWeightGrams: input.totalWeightGrams,
      baseFee: base.baseFee,
      includedGrams: base.includedGrams,
      additionalGrams,
      additionalKg,
      additionalFee,
      totalFee: base.baseFee + additionalFee,
      isFallback: base.isFallback,
    };
  }

  private normalizeCounty(county: string) {
    const clean = county.trim();
    return KENYAN_COUNTIES.find((name) => name.toLowerCase() === clean.toLowerCase()) ?? clean;
  }

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
