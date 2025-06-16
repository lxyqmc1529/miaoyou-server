import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { dbLogger } from '../utils/winston-logger';

@Injectable()
export class DatabaseLoggerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const startTime = Date.now();
    
    // 从URL推断数据库操作类型
    const operation = this.getOperationType(method, url);
    const entity = this.getEntityFromUrl(url);
    
    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        dbLogger.logDatabase(operation, entity, duration);
        
        // 记录慢查询
        if (duration > 500) {
          dbLogger.logPerformance(`Database ${operation} on ${entity}`, duration, 500);
        }
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        dbLogger.logDatabase(operation, entity, duration, error);
        throw error;
      })
    );
  }

  private getOperationType(method: string, url: string): string {
    switch (method.toUpperCase()) {
      case 'GET':
        return url.includes('/') && url.split('/').length > 3 ? 'SELECT_ONE' : 'SELECT';
      case 'POST':
        return 'INSERT';
      case 'PUT':
      case 'PATCH':
        return 'UPDATE';
      case 'DELETE':
        return 'DELETE';
      default:
        return 'UNKNOWN';
    }
  }

  private getEntityFromUrl(url: string): string {
    const segments = url.split('/').filter(segment => segment && segment !== 'api');
    return segments[0] || 'unknown';
  }
}