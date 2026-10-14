import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = "INTERNAL_SERVER_ERROR";
    let message = "Something went wrong";
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();

      if (typeof body === "string") {
        message = body;
        code = exception.name;
      } else if (typeof body === "object" && body !== null) {
        const b = body as Record<string, unknown>;
        message = (b.message as string) ?? exception.message;
        code = (b.code as string) ?? exception.name;
        details = b.details;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(exception.stack ?? exception.message);
    }

    res.status(status).json({
      success: false,
      error: { code, message, details },
      path: req.url,
      timestamp: new Date().toISOString(),
    });
  }
}