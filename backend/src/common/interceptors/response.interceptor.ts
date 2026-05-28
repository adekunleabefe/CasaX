import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

interface MessageResponse {
  message?: string;
  data?: unknown;
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor<
  unknown,
  { success: true; message: string; data: unknown }
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<{ success: true; message: string; data: unknown }> {
    return next.handle().pipe(
      map((value) => {
        const isMessageResponse =
          typeof value === 'object' &&
          value !== null &&
          ('message' in value || 'data' in value);
        if (isMessageResponse) {
          const response = value as MessageResponse;
          return {
            success: true,
            message: response.message ?? 'Request completed successfully',
            data: response.data ?? null,
          };
        }
        return {
          success: true,
          message: 'Request completed successfully',
          data: value ?? null,
        };
      }),
    );
  }
}
