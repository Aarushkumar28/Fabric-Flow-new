import {
  Catch,
  ArgumentsHost,
  HttpStatus,
  ExceptionFilter,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Catches Prisma-specific errors (P2002 unique constraint, P2003 foreign key,
 * P2025 record not found) and returns a user-friendly JSON error response
 * instead of a generic 500 Internal Server Error.
 */
@Catch()
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const prismaErr = exception as {
      code?: string;
      meta?: { target?: string[] | string; cause?: string };
      message?: string;
    };

    // Handle Prisma unique constraint violation (P2002)
    if (prismaErr?.code === 'P2002') {
      const target = prismaErr.meta?.target;
      const field = Array.isArray(target)
        ? target.join(', ')
        : typeof target === 'string'
          ? target
          : 'unknown field';
      return response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        message: `Unique constraint failed: ${field}. A record with this value already exists.`,
        error: 'Conflict',
      });
    }

    // Handle Prisma foreign key constraint (P2003)
    if (prismaErr?.code === 'P2003') {
      return response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Cannot complete this action because of a linked record dependency.',
        error: 'Bad Request',
      });
    }

    // Handle Prisma record not found (P2025)
    if (prismaErr?.code === 'P2025') {
      return response.status(HttpStatus.NOT_FOUND).json({
        statusCode: HttpStatus.NOT_FOUND,
        message: prismaErr.meta?.cause || 'Record not found.',
        error: 'Not Found',
      });
    }

    // Let NestJS handle all other exceptions (HttpException, etc.)
    // Re-throw so NestJS default exception filter handles it
    const httpErr = exception as { getStatus?: () => number; getResponse?: () => unknown };
    if (typeof httpErr?.getStatus === 'function') {
      const status = httpErr.getStatus();
      const body = httpErr.getResponse?.() ?? { statusCode: status, message: 'Error' };
      return response.status(status).json(body);
    }

    // Unknown error — 500
    console.error('[PrismaExceptionFilter] Unhandled error:', exception);
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  }
}
