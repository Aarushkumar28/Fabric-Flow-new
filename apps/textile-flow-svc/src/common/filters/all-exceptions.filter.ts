import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // ---- Log the real error for the developer ----
    this.logger.error(
      `Unhandled exception on ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    // ---- Determine the status and message safely ----
    let status: number;
    let message: string | string[];

    try {
      if (exception instanceof HttpException) {
        status = exception.getStatus();
        const res = exception.getResponse();
        if (typeof res === 'object' && res !== null && 'message' in res) {
          const resMessage = res.message;
          message = Array.isArray(resMessage) ? resMessage : String(resMessage);
        } else {
          message = typeof res === 'string' ? res : JSON.stringify(res);
        }
      } else if (
        exception instanceof Error &&
        exception.constructor.name === 'PrismaClientKnownRequestError'
      ) {
        const prismaError = exception as {
          code?: string;
          meta?: { target?: unknown; field_name?: unknown };
          message?: string;
        };
        switch (prismaError.code) {
          case 'P2002':
            status = HttpStatus.CONFLICT;
            message = `Unique constraint failed: ${String(prismaError.meta?.target)}`;
            break;
          case 'P2003':
            status = HttpStatus.BAD_REQUEST;
            message = `Foreign key constraint failed: ${String(prismaError.meta?.field_name)}`;
            break;
          case 'P2025':
            status = HttpStatus.NOT_FOUND;
            message = 'Record not found';
            break;
          default:
            status = HttpStatus.BAD_REQUEST;
            message = `Database error ${prismaError.code ?? 'unknown'}: ${prismaError.message ?? 'Unknown error'}`;
        }
      } else if (exception instanceof Error) {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = exception.message;
      } else {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Internal server error';
      }
    } catch {
      // If even extracting the message fails, provide a generic fallback
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
    }

    // ---- Always return valid JSON ----
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
