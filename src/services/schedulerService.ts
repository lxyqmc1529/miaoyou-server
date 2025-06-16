import * as cron from 'node-cron';
import { analyticsService } from './analyticsService';
import { logger, BehaviorType } from '../utils/logger';

// 调度器服务类
export class SchedulerService {
  private static instance: SchedulerService;
  private tasks: Map<string, cron.ScheduledTask> = new Map();

  private constructor() {}

  public static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService();
    }
    return SchedulerService.instance;
  }

  // 启动所有定时任务
  public startAllTasks(): void {
    this.startDailyAnalyticsTask();
    this.startLogCleanupTask();
    this.startAnalyticsCleanupTask();
    console.log('所有定时任务已启动');
  }

  // 停止所有定时任务
  public stopAllTasks(): void {
    this.tasks.forEach((task, name) => {
      task.stop();
      console.log(`定时任务 ${name} 已停止`);
    });
    this.tasks.clear();
    console.log('所有定时任务已停止');
  }

  /**
   * 获取任务状态
   */
  getTaskStatus() {
    return Array.from(this.tasks.entries()).map(([name, task]) => ({
      name,
      running: task.getStatus() === 'scheduled',
      nextRun: null // node-cron 不支持获取下次执行时间
    }));
  }

  /**
   * 重启指定任务
   */
  restartTask(taskName: string): boolean {
    const task = this.tasks.get(taskName);
    if (!task) {
      return false;
    }

    task.stop();
    task.start();
    
    console.log(`任务 ${taskName} 已重启`);
    return true;
  }

  // 每日分析任务 - 每晚12点执行
  private startDailyAnalyticsTask(): void {
    const taskName = 'daily-analytics';
    
    // 每天凌晨12点执行
    const task = cron.schedule('0 0 * * *', async () => {
      try {
        console.log('开始执行每日分析任务...');
        
        // 获取昨天的日期
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateStr = yesterday.toISOString().split('T')[0];
        
        // 处理昨天的日志
        await analyticsService.processDailyLogs(dateStr);
        
        console.log(`每日分析任务完成: ${dateStr}`);
        
        // 记录任务执行日志
        logger.logBehavior({
          type: BehaviorType.PAGE_VIEW, // 使用现有的 BehaviorType 枚举值
          sessionId: 'system',
          ipAddress: '127.0.0.1',
          userAgent: 'SchedulerService',
          extra: {
            taskName: 'daily-analytics',
            processedDate: dateStr,
            status: 'success'
          }
        });
        
      } catch (error) {
        console.error('每日分析任务执行失败:', error);
        
        // 记录错误日志
        logger.logError({
          level: 'error',
          message: '每日分析任务执行失败',
          stack: error instanceof Error ? error.stack : undefined,
          extra: {
            taskName: 'daily-analytics',
            error: error instanceof Error ? error.message : String(error)
          }
        });
      }
    }, {
      timezone: 'Asia/Shanghai'
    });
    
    this.tasks.set(taskName, task);
    task.start();
    console.log(`定时任务 ${taskName} 已启动 (每天00:00执行)`);
  }

  // 日志清理任务 - 每周日凌晨2点执行
  private startLogCleanupTask(): void {
    const taskName = 'log-cleanup';
    
    // 每周日凌晨2点执行
    const task = cron.schedule('0 2 * * 0', async () => {
      try {
        console.log('开始执行日志清理任务...');
        
        // 清理30天前的日志文件
        logger.cleanupOldLogs(30);
        
        console.log('日志清理任务完成');
        
        // 记录任务执行日志
        logger.logBehavior({
          type: BehaviorType.PAGE_VIEW, // 使用现有的 BehaviorType 枚举值
          sessionId: 'system',
          ipAddress: '127.0.0.1',
          userAgent: 'SchedulerService',
          extra: {
            taskName: 'log-cleanup',
            status: 'success'
          }
        });
        
      } catch (error) {
        console.error('日志清理任务执行失败:', error);
        
        // 记录错误日志
        logger.logError({
          level: 'error',
          message: '日志清理任务执行失败',
          stack: error instanceof Error ? error.stack : undefined,
          extra: {
            taskName: 'log-cleanup',
            error: error instanceof Error ? error.message : String(error)
          }
        });
      }
    }, {
      timezone: 'Asia/Shanghai'
    });
    
    this.tasks.set(taskName, task);
    task.start();
    console.log(`定时任务 ${taskName} 已启动 (每周日02:00执行)`);
  }

  // 分析数据清理任务 - 每月1号凌晨3点执行
  private startAnalyticsCleanupTask(): void {
    const taskName = 'analytics-cleanup';
    
    // 每月1号凌晨3点执行
    const task = cron.schedule('0 3 1 * *', async () => {
      try {
        console.log('开始执行分析数据清理任务...');
        
        // 清理90天前的分析数据
        await analyticsService.cleanupOldAnalytics(90);
        
        console.log('分析数据清理任务完成');
        
        // 记录任务执行日志
        logger.logBehavior({
          type: BehaviorType.PAGE_VIEW, // 使用现有的 BehaviorType 枚举值
          sessionId: 'system',
          ipAddress: '127.0.0.1',
          userAgent: 'SchedulerService',
          extra: {
            taskName: 'analytics-cleanup',
            status: 'success'
          }
        });
        
      } catch (error) {
        console.error('分析数据清理任务执行失败:', error);
        
        // 记录错误日志
        logger.logError({
          level: 'error',
          message: '分析数据清理任务执行失败',
          stack: error instanceof Error ? error.stack : undefined,
          extra: {
            taskName: 'analytics-cleanup',
            error: error instanceof Error ? error.message : String(error)
          }
        });
      }
    }, {
      timezone: 'Asia/Shanghai'
    });
    
    this.tasks.set(taskName, task);
    task.start();
    console.log(`定时任务 ${taskName} 已启动 (每月1号03:00执行)`);
  }

  /**
   * 执行昨天的分析任务
   */
  async runYesterdayAnalytics(): Promise<void> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    
    await this.runAnalyticsForDate(dateStr);
  }

  /**
   * 执行指定日期的分析任务
   */
  async runAnalyticsForDate(date: string): Promise<void> {
    try {
      console.log(`开始处理 ${date} 的分析任务`);
      await analyticsService.processDailyLogs(date);
      console.log(`${date} 的分析任务处理完成`);
    } catch (error) {
      console.error(`处理 ${date} 分析任务失败:`, error);
      throw error;
    }
  }
}

// 导出单例实例
export const schedulerService = SchedulerService.getInstance();