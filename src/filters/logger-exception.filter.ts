import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { appLogger, securityLogger, LogLevel } from '../utils/winston-logger';

@Catch()
export class LoggerExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: typeof message === 'string' ? message : (message as any).message || message,
    };

    // 记录错误日志
    const logContext = {
      method: request.method,
      url: request.url,
      statusCode: status,
      ip: request.ip,
      userAgent: request.get('User-Agent'),
      userId: (request as any).user?.id,
      sessionId: (request as any).sessionID,
      body: request.body,
      query: request.query,
      params: request.params,
    };

    if (status >= 500) {
      // 服务器错误
      appLogger.error(
        `Server Error: ${request.method} ${request.url} - ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
        'ExceptionFilter'
      );
    } else if (status === 401 || status === 403) {
      // 安全相关错误
      securityLogger.logSecurity('Authentication/Authorization Error', {
        ...logContext,
        error: typeof message === 'string' ? message : JSON.stringify(message),
      });
    } else {
      // 客户端错误
      appLogger.logWithContext(
        LogLevel.WARN,
        `Client Error: ${request.method} ${request.url} - ${status}`,
        logContext
      );
    }

    response.status(status).json(errorResponse);
  }
}