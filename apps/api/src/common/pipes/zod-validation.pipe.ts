import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from "@nestjs/common";
import { ZodSchema, ZodError } from "zod";

/**
 * Usage in a controller:
 *   @Body(new ZodValidationPipe(loginSchema)) dto: LoginInput
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata) {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: error.flatten().fieldErrors,
        });
      }
      throw error;
    }
  }
}