import { Controller, Get, Post, Body, Res, Query } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';
import { 
  appLogger, 
  authLogger, 
  dbLogger, 
  securityLogger,
  createModuleLogger,
  LogLevel 
} from '../utils/winston-logger';

@Controller('logger-test')
export class LoggerTestController {
  private readonly logger = createModuleLogger('LoggerTest');

  @Get('dashboard')
  getDashboard(@Res() res: Response) {
    try {
      const dashboardPath = join(__dirname, '..', 'views', 'logger-dashboard.html');
      this.logger.info(`Attempting to serve dashboard from: ${dashboardPath}`);
      
      res.sendFile(dashboardPath, (err) => {
        if (err) {
          this.logger.error('Failed to serve dashboard file', err.stack, 'LoggerTest');
          res.status(500).json({ 
            error: 'Failed to load dashboard', 
            path: dashboardPath,
            message: err.message 
          });
        } else {
          this.logger.info('Dashboard served successfully');
        }
      });
    } catch (error) {
      this.logger.error('Error in getDashboard method', error.stack, 'LoggerTest');
      res.status(500).json({ 
        error: 'Internal server error', 
        message: error.message 
      });
    }
  }

  @Post('log')
  async testLog(@Body() body: { level: string; message: string; context?: any }) {
    const { level, message, context } = body;
    
    try {
      switch (level.toLowerCase()) {
        case 'error':
          this.logger.error(message, context?.stack || 'TestError', context?.module || 'LoggerTest');
          break;
        case 'warn':
          this.logger.warn(message, context?.module || 'LoggerTest');
          break;
        case 'info':
          this.logger.info(message, context);
          break;
        case 'debug':
          this.logger.debug(message, context?.module || 'LoggerTest');
          break;
        default:
          this.logger.info(message, context);
      }
      
      return { success: true, message: '日志记录成功' };
    } catch (error) {
      this.logger.error('记录测试日志失败', error.stack, 'LoggerTest');
      return { success: false, message: '日志记录失败' };
    }
  }

  @Post('test-scenarios')
  async testScenarios() {
    const scenarios = [
      {
        name: '用户认证测试',
        action: () => {
          authLogger.info('用户登录尝试', { userId: 'test123', ip: '127.0.0.1' });
          authLogger.warn('密码错误次数过多', 'AuthWarning');
        }
      },
      {
        name: '数据库操作测试',
        action: () => {
          dbLogger.logDatabase('SELECT', 'users', 150);
          dbLogger.logDatabase('INSERT', 'articles', 300);
          dbLogger.logDatabase('UPDATE', 'users', 2500, new Error('连接超时'));
        }
      },
      {
        name: '安全事件测试',
        action: () => {
          securityLogger.logSecurity('可疑登录', {
            ip: '192.168.1.100',
            userAgent: 'Suspicious Bot',
            attempts: 5
          });
        }
      },
      {
        name: '性能监控测试',
        action: () => {
          this.logger.logPerformance('API响应时间', 1200, 1000);
          this.logger.logPerformance('数据库查询', 800, 500);
        }
      },
      {
        name: '业务流程测试',
        action: () => {
          this.logger.logBusiness('订单创建', {
            orderId: 'ORD-' + Date.now(),
            userId: 'user123',
            amount: 299.99
          });
          this.logger.logBusiness('支付完成', {
            orderId: 'ORD-' + Date.now(),
            paymentMethod: '支付宝',
            status: 'success'
          });
        }
      }
    ];

    const results = [];
    
    for (const scenario of scenarios) {
      try {
        scenario.action();
        results.push({ name: scenario.name, status: 'success' });
        this.logger.info(`测试场景执行成功: ${scenario.name}`);
      } catch (error) {
        results.push({ name: scenario.name, status: 'failed', error: error.message });
        this.logger.error(`测试场景执行失败: ${scenario.name}`, error.stack, 'ScenarioTest');
      }
    }

    return {
      success: true,
      message: '测试场景执行完成',
      results
    };
  }

  @Get('logs')
  async getLogs(@Query('level') level?: string, @Query('limit') limit?: string) {
    // 这里可以实现从日志文件或数据库读取日志的逻辑
    // 目前返回模拟数据
    const mockLogs = [
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: '用户访问了首页',
        context: { userId: 'user123', ip: '127.0.0.1' }
      },
      {
        timestamp: new Date(Date.now() - 60000).toISOString(),
        level: 'warn',
        message: 'API响应时间较慢',
        context: { endpoint: '/api/articles', duration: 1200 }
      },
      {
        timestamp: new Date(Date.now() - 120000).toISOString(),
        level: 'error',
        message: '数据库连接失败',
        context: { database: 'main', error: 'Connection timeout' }
      }
    ];

    let filteredLogs = mockLogs;
    
    if (level && level !== 'all') {
      filteredLogs = mockLogs.filter(log => log.level === level);
    }
    
    const limitNum = limit ? parseInt(limit) : 50;
    filteredLogs = filteredLogs.slice(0, limitNum);

    return {
      success: true,
      logs: filteredLogs,
      total: filteredLogs.length
    };
  }

  @Get('stats')
  async getLogStats() {
    // 这里可以实现真实的统计逻辑
    // 目前返回模拟数据
    return {
      success: true,
      stats: {
        error: Math.floor(Math.random() * 10),
        warn: Math.floor(Math.random() * 20),
        info: Math.floor(Math.random() * 100),
        debug: Math.floor(Math.random() * 50)
      },
      performance: {
        avgResponseTime: 450 + Math.floor(Math.random() * 200),
        dbQueryTime: 120 + Math.floor(Math.random() * 100),
        errorRate: (Math.random() * 5).toFixed(2) + '%'
      }
    };
  }

  @Post('stress-test')
  async stressTest(@Body() body: { count?: number; interval?: number }) {
    const { count = 100, interval = 10 } = body;
    
    this.logger.info(`开始压力测试: ${count}条日志, 间隔${interval}ms`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < count; i++) {
      try {
        const levels = ['error', 'warn', 'info', 'debug'];
        const level = levels[Math.floor(Math.random() * levels.length)];
        const message = `压力测试日志 #${i + 1} - ${level}`;
        
        switch (level) {
          case 'error':
            this.logger.error(message, 'StressTestError', 'StressTest');
            break;
          case 'warn':
            this.logger.warn(message, 'StressTest');
            break;
          case 'info':
            this.logger.info(message, { testId: i + 1 });
            break;
          case 'debug':
            this.logger.debug(message, 'StressTest');
            break;
        }
        
        successCount++;
        
        if (interval > 0) {
          await new Promise(resolve => setTimeout(resolve, interval));
        }
      } catch (error) {
        errorCount++;
        this.logger.error(`压力测试失败 #${i + 1}`, error.stack, 'StressTest');
      }
    }
    
    const result = {
      success: true,
      message: '压力测试完成',
      results: {
        total: count,
        success: successCount,
        errors: errorCount,
        successRate: ((successCount / count) * 100).toFixed(2) + '%'
      }
    };
    
    this.logger.info('压力测试结果', result.results);
    return result;
  }
}