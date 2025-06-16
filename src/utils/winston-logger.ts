import { LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';

// 日志级别
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  DEBUG = 'debug'
}

// 日志上下文接口
export interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
  [key: string]: any;
}

// 自定义日志格式
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, context, stack, ...meta }) => {
    const logObject = {
      timestamp,
      level,
      message,
      ...(context && { context }),
      ...(stack && { stack }),
      ...meta
    };
    return JSON.stringify(logObject);
  })
);

// 控制台格式
const consoleFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, context }) => {
    const contextStr = context ? ` [${context}]` : '';
    return `${timestamp} ${level}${contextStr}: ${message}`;
  })
);

export class WinstonLogger implements LoggerService {
  private logger: winston.Logger;
  private context?: string;

  constructor(context?: string) {
    this.context = context;
    this.logger = this.createLogger();
  }

  private createLogger(): winston.Logger {
    // 确保日志目录存在
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const transports: winston.transport[] = [
      // 控制台输出
      new winston.transports.Console({
        format: consoleFormat,
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
      }),

      // 错误日志文件
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        format: customFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5
      }),

      // 组合日志文件
      new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        format: customFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5
      }),

      // HTTP请求日志
      new winston.transports.File({
        filename: path.join(logDir, 'http.log'),
        level: 'http',
        format: customFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5
      })
    ];

    // 生产环境添加按日期分割的日志
    if (process.env.NODE_ENV === 'production') {
      const DailyRotateFile = require('winston-daily-rotate-file');
      
      transports.push(
        new DailyRotateFile({
          filename: path.join(logDir, 'application-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          format: customFormat
        })
      );
    }

    return winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: customFormat,
      transports,
      // 处理未捕获的异常
      exceptionHandlers: [
        new winston.transports.File({
          filename: path.join(logDir, 'exceptions.log'),
          format: customFormat
        })
      ],
      // 处理未处理的Promise拒绝
      rejectionHandlers: [
        new winston.transports.File({
          filename: path.join(logDir, 'rejections.log'),
          format: customFormat
        })
      ]
    });
  }

  // NestJS Logger接口实现
  log(message: any, context?: string): void {
    this.info(message, context);
  }

  error(message: any, trace?: string, context?: string): void {
    const logContext = context || this.context;
    this.logger.error(message, {
      context: logContext,
      stack: trace
    });
  }

  warn(message: any, context?: string): void {
    const logContext = context || this.context;
    this.logger.warn(message, { context: logContext });
  }

  debug(message: any, context?: string): void {
    const logContext = context || this.context;
    this.logger.debug(message, { context: logContext });
  }

  verbose(message: any, context?: string): void {
    this.debug(message, context);
  }

  // 扩展方法
  info(message: string, context?: string | LogContext): void {
    if (typeof context === 'string') {
      this.logger.info(message, { context });
    } else {
      this.logger.info(message, { context: this.context, ...context });
    }
  }

  http(message: string, context?: LogContext): void {
    this.logger.http(message, { context: this.context, ...context });
  }

  // 结构化日志方法
  logWithContext(level: LogLevel, message: string, context: LogContext): void {
    this.logger.log(level, message, { context: this.context, ...context });
  }

  // API请求日志
  logRequest(req: any, res: any, responseTime: number): void {
    const context: LogContext = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      sessionId: req.sessionID
    };

    const message = `${req.method} ${req.url} ${res.statusCode} - ${responseTime}ms`;
    
    if (res.statusCode >= 400) {
      this.error(message, undefined, 'HTTP');
    } else {
      this.logger.http(message, { context: this.context, ...context });
    }
  }

  // 数据库操作日志
  logDatabase(operation: string, table: string, duration?: number, error?: Error): void {
    const context: LogContext = {
      operation,
      table,
      duration
    };

    if (error) {
      this.error(`Database ${operation} failed on ${table}: ${error.message}`, error.stack, 'Database');
    } else {
      this.logger.debug(`Database ${operation} on ${table}${duration ? ` - ${duration}ms` : ''}`, { context: this.context, ...context });
    }
  }

  // 业务逻辑日志
  logBusiness(action: string, details: any, userId?: string): void {
    const context: LogContext = {
      action,
      userId,
      ...details
    };

    this.info(`Business action: ${action}`, context);
  }

  // 安全相关日志
  logSecurity(event: string, details: LogContext): void {
    this.logger.warn(`Security event: ${event}`, { context: this.context, ...details, security: true });
  }

  // 性能监控日志
  logPerformance(operation: string, duration: number, threshold: number = 1000): void {
    const context: LogContext = {
      operation,
      duration,
      performance: true
    };

    if (duration > threshold) {
      this.logger.warn(`Slow operation detected: ${operation} took ${duration}ms`, { context: this.context, ...context });
    } else {
      this.logger.debug(`Performance: ${operation} - ${duration}ms`, { context: this.context, ...context });
    }
  }

  // 创建子logger
  child(context: string): WinstonLogger {
    return new WinstonLogger(context);
  }
}

// 创建全局logger实例
export const appLogger = new WinstonLogger('Application');

// 为不同模块创建专用logger
export const createModuleLogger = (moduleName: string): WinstonLogger => {
  return new WinstonLogger(moduleName);
};

// 导出常用的logger实例
export const authLogger = createModuleLogger('Auth');
export const dbLogger = createModuleLogger('Database');
export const httpLogger = createModuleLogger('HTTP');
export const securityLogger = createModuleLogger('Security');