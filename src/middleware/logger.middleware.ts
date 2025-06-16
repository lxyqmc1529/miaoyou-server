import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { httpLogger, LogLevel } from '../utils/winston-logger';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('User-Agent') || '';
    
    // 记录请求开始
    httpLogger.logWithContext(LogLevel.INFO, `Incoming request: ${method} ${originalUrl}`, {
      method,
      url: originalUrl,
      ip,
      userAgent,
      userId: (req as any).user?.id,
      sessionId: (req as any).sessionID
    });

    // 监听响应结束事件
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      const { statusCode } = res;
      
      httpLogger.logRequest(req, res, responseTime);
      
      // 记录慢请求
      if (responseTime > 1000) {
        httpLogger.logPerformance(`${method} ${originalUrl}`, responseTime, 1000);
      }
      
      // 记录错误响应
      if (statusCode >= 400) {
        httpLogger.logWithContext(LogLevel.WARN, `Error response: ${method} ${originalUrl} - ${statusCode}`, {
          method,
          url: originalUrl,
          statusCode,
          responseTime,
          ip,
          userAgent,
          userId: (req as any).user?.id
        });
      }
    });

    next();
  }
}