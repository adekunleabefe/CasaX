import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const isUniqueConstraintError =
      exception instanceof Prisma.PrismaClientKnownRequestError &&
      exception.code === 'P2002';
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : isUniqueConstraintError
          ? HttpStatus.CONFLICT
          : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : isUniqueConstraintError
          ? 'A record with this value already exists'
          : 'Internal server error';
    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : ((exceptionResponse as { message?: string | string[] }).message ??
          'Request failed');

    this.logException(exception, request, status, message);

    response.status(status).json({
      success: false,
      message,
      error: HttpStatus[status],
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private logException(
    exception: unknown,
    request: Request,
    status: number,
    message: string | string[],
  ): void {
    const requestContext = `${request.method} ${request.originalUrl} (${status})`;
    const stack =
      process.env.NODE_ENV !== 'production' && exception instanceof Error
        ? exception.stack
        : undefined;

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const details =
        process.env.NODE_ENV !== 'production' ? `: ${exception.message}` : '';
      this.logger.error(
        `${requestContext} Prisma ${exception.code}${details}`,
        stack,
      );
      return;
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      const details =
        process.env.NODE_ENV !== 'production' ? `: ${exception.message}` : '';
      this.logger.error(
        `${requestContext} Prisma validation error${details}`,
        stack,
      );
      return;
    }

    if (exception instanceof HttpException && status < 500) {
      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn(`${requestContext}: ${JSON.stringify(message)}`);
      }
      return;
    }

    this.logger.error(
      `${requestContext}: ${
        exception instanceof Error ? exception.message : String(exception)
      }`,
      stack,
    );
  }
}
