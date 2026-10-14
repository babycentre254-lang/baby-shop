import { Injectable, Logger } from "@nestjs/common";
import { Model } from "mongoose";
import slugify from "slugify";

@Injectable()
export class SlugService {
  private readonly logger = new Logger(SlugService.name);

  /**
   * Generate a unique slug for a given model. If a collision exists,
   * appends -2, -3, ... until unique.
   */
  async generateUnique(
    model: Model<any>,
    source: string,
    excludeId?: string
  ): Promise<string> {
    const base = slugify(source, { lower: true, strict: true, trim: true });
    if (!base) throw new Error(`Cannot slugify empty string: "${source}"`);

    let candidate = base;
    let counter = 1;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const filter: Record<string, unknown> = { slug: candidate };
      if (excludeId) filter._id = { $ne: excludeId };
      const exists = await model.exists(filter);
      if (!exists) return candidate;
      counter += 1;
      candidate = `${base}-${counter}`;
    }
  }

  /**
   * Generate a SKU from product name + variant attributes.
   * Example: "Cotton Onesie", size "0-3M", color "Blue" -> COT-ONE-0-3M-BLU-XXXX
   */
  generateSku(
    productName: string,
    opts: { size?: string; color?: string; suffix?: string } = {}
  ): string {
    const parts = [productName];
    if (opts.size) parts.push(opts.size);
    if (opts.color) parts.push(opts.color);

    const base = parts
      .join(" ")
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .split("-")
      .filter(Boolean)
      .map((p) => p.slice(0, 4))
      .join("-");

    const suffix = opts.suffix ?? this.randomSuffix();
    return `${base}-${suffix}`.slice(0, 50);
  }

  private randomSuffix(): string {
    return Math.random().toString(36).slice(2, 6).toUpperCase();
  }
}