import fs from 'fs';
import path from 'path';

// 日志类型枚举
export enum LogType {
  BEHAVIOR = 'behavior',
  ERROR = 'error'
}

// 行为日志类型
export enum BehaviorType {
  PAGE_VIEW = 'page_view',
  ARTICLE_VIEW = 'article_view',
  MOMENT_VIEW = 'moment_view',
  WORK_VIEW = 'work_view',
  USER_VISIT = 'user_visit',
  COMMENT_CREATE = 'comment_create',
  LIKE_ACTION = 'like_action'
}

// 行为日志接口
export interface BehaviorLog {
  timestamp: string;
  type: BehaviorType;
  targetId?: string;
  targetTitle?: string;
  userId?: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  referer?: string;
  country?: string;
  city?: string;
  device?: string;
  browser?: string;
  os?: string;
  duration?: number; // 页面停留时间（秒）
  extra?: Record<string, unknown>; // 额外数据
}

// 错误日志接口
export interface ErrorLog {
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  url?: string;
  method?: string;
  statusCode?: number;
  extra?: Record<string, unknown>;
}

// 日志管理器类
export class Logger {
  private static instance: Logger;
  private logDir: string;

  private constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.ensureLogDirectory();
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  // 确保日志目录存在
  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  // 获取日志文件路径
  private getLogFilePath(type: LogType, date?: string): string {
    const dateStr = date || this.getCurrentDateString();
    return path.join(this.logDir, `${type}-${dateStr}.log`);
  }

  // 获取当前日期字符串 (YYYY-MM-DD)
  private getCurrentDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  // 写入日志文件
  private writeLog(type: LogType, data: unknown, date?: string): void {
    const filePath = this.getLogFilePath(type, date);
    const logEntry = JSON.stringify(data) + '\n';
    
    try {
      fs.appendFileSync(filePath, logEntry, 'utf8');
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  }

  // 记录行为日志
  public logBehavior(behaviorLog: Omit<BehaviorLog, 'timestamp'>): void {
    const log: BehaviorLog = {
      ...behaviorLog,
      timestamp: new Date().toISOString()
    };
    this.writeLog(LogType.BEHAVIOR, log);
  }

  // 记录错误日志
  public logError(errorLog: Omit<ErrorLog, 'timestamp'>): void {
    const log: ErrorLog = {
      ...errorLog,
      timestamp: new Date().toISOString()
    };
    this.writeLog(LogType.ERROR, log);
  }

  // 读取指定日期的日志文件
  public readLogs(type: LogType, date: string): unknown[] {
    const filePath = this.getLogFilePath(type, date);
    
    if (!fs.existsSync(filePath)) {
      return [];
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return content
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));
    } catch (error) {
      console.error('Failed to read log file:', error);
      return [];
    }
  }

  // 获取日志文件列表
  public getLogFiles(type: LogType): string[] {
    try {
      const files = fs.readdirSync(this.logDir);
      return files
        .filter(file => file.startsWith(`${type}-`) && file.endsWith('.log'))
        .map(file => file.replace(`${type}-`, '').replace('.log', ''))
        .sort();
    } catch (error) {
      console.error('Failed to read log directory:', error);
      return [];
    }
  }

  // 删除过期日志文件（保留指定天数）
  public cleanupOldLogs(retentionDays: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

    try {
      const files = fs.readdirSync(this.logDir);
      files.forEach(file => {
        const match = file.match(/^(behavior|error)-(\d{4}-\d{2}-\d{2})\.log$/);
        if (match && match[2] < cutoffDateStr) {
          const filePath = path.join(this.logDir, file);
          fs.unlinkSync(filePath);
          console.log(`Deleted old log file: ${file}`);
        }
      });
    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
    }
  }
}

// 导出单例实例
export const logger = Logger.getInstance();