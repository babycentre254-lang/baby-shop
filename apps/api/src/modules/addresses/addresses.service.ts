import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Types } from "mongoose";
import { AddressesRepository } from "./addresses.repository";
import { AddressDocument } from "./schemas/address.schema";
import type {
  CreateAddressInput,
  UpdateAddressInput,
} from "@baby-shop/shared";

@Injectable()
export class AddressesService {
  constructor(private readonly repo: AddressesRepository) {}

  list(userId: string) {
    return this.repo.findByUser(userId);
  }

  async getOne(userId: string, id: string): Promise<AddressDocument> {
    const doc = await this.repo.findByIdForUser(id, userId);
    if (!doc) {
      throw new NotFoundException({
        code: "ADDRESS_NOT_FOUND",
        message: "Address not found",
      });
    }
    return doc;
  }

  async create(
    userId: string,
    input: CreateAddressInput
  ): Promise<AddressDocument> {
    // If this is the user's first address, force isDefault true
    const existing = await this.repo.findByUser(userId);
    const shouldBeDefault = existing.length === 0 || input.isDefault;

    if (shouldBeDefault) {
      await this.repo.clearDefaultsForUser(userId);
    }

    return this.repo.create({
      ...input,
      isDefault: shouldBeDefault,
      userId: new Types.ObjectId(userId),
    });
  }

  async update(
    userId: string,
    id: string,
    input: UpdateAddressInput
  ): Promise<AddressDocument> {
    await this.getOne(userId, id);

    if (input.isDefault) {
      await this.repo.clearDefaultsForUser(userId, id);
    }

    const updated = await this.repo.updateById(id, input);
    if (!updated) throw new NotFoundException("Address not found");
    return updated;
  }

  async remove(userId: string, id: string): Promise<void> {
    const doc = await this.getOne(userId, id);
    if (doc.isDefault) {
      throw new ForbiddenException({
        code: "CANNOT_DELETE_DEFAULT",
        message:
          "Cannot delete the default address. Set another address as default first.",
      });
    }
    await this.repo.deleteById(id);
  }
}