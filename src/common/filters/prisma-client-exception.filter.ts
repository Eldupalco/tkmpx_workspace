import {
  ArgumentsHost,
  Catch,
  HttpStatus,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '../../generated/prisma/client.js';
import type { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    switch (exception.code) {
      case 'P2002': {
        const target =
          (exception.meta?.target as string[])?.join(', ') ||
          (exception.meta?.target as string) ||
          'unique field';
        response.status(HttpStatus.CONFLICT).json({
          statusCode: HttpStatus.CONFLICT,
          error: 'Conflict',
          message: `A record with this ${target} already exists`,
        });
        break;
      }
      case 'P2003': {
        const field = (exception.meta?.field_name as string) || 'foreign key';
        response.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
          message: `Foreign key constraint failed: referenced record in "${field}" does not exist`,
        });
        break;
      }
      case 'P2025': {
        response.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          error: 'Not Found',
          message: (exception.meta?.cause as string) || 'Record not found',
        });
        break;
      }
      default:
        super.catch(exception, host);
        break;
    }
  }
}

