import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

/**
 * Wraps every successful controller return in:
 *   { success: true, data: <controllerReturn> }
 * If the controller already returns an ApiSuccess envelope, it's left alone.
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, unknown> {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === "object" && "success" in data) {
          return data;
        }
        return { success: true, data };
      })
    );
  }
}