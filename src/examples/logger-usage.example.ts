/**
 * 日志系统使用示例
 * 这个文件展示了如何在不同场景下使用新的日志系统
 */

import { Injectable, Controller, Get, Post, Body, Param } from '@nestjs/common';
import { 
  appLogger, 
  authLogger, 
  dbLogger, 
  securityLogger,
  createModuleLogger,
  WinstonLogger,
  LogLevel 
} from '../utils/winston-logger';

// 1. 在Service中使用日志
@Injectable()
export class ExampleService {
  private readonly logger = createModuleLogger('ExampleService');

  async findUser(id: string) {
    const startTime = Date.now();
    
    try {
      this.logger.info(`开始查找用户: ${id}`);
      
      // 模拟数据库查询
      const user = await this.mockDatabaseQuery(id);
      
      const duration = Date.now() - startTime;
      this.logger.logDatabase('SELECT', 'users', duration);
      
      if (!user) {
        this.logger.warn(`用户不存在: ${id}`, 'UserNotFound');
        return null;
      }
      
      this.logger.info(`成功找到用户: ${id}`, { userId: id, username: user.username });
      return user;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.logDatabase('SELECT', 'users', duration, error);
      this.logger.error(`查找用户失败: ${id}`, error.stack);
      throw error;
    }
  }

  async createUser(userData: any) {
    try {
      this.logger.logBusiness('用户注册', {
        email: userData.email,
        username: userData.username
      });
      
      // 模拟创建用户
      const user = await this.mockCreateUser(userData);
      
      this.logger.info(`用户创建成功: ${user.id}`, {
        userId: user.id,
        username: user.username,
        email: user.email
      });
      
      return user;
      
    } catch (error) {
      this.logger.error(`用户创建失败`, error.stack, 'UserCreation');
      throw error;
    }
  }

  async authenticateUser(email: string, password: string) {
    try {
      authLogger.info(`用户登录尝试: ${email}`);
      
      // 模拟身份验证
      const isValid = await this.mockAuthenticate(email, password);
      
      if (!isValid) {
        securityLogger.logSecurity('登录失败', {
          email,
          reason: '密码错误',
          ip: '127.0.0.1' // 实际应用中从请求中获取
        });
        throw new Error('Invalid credentials');
      }
      
      authLogger.info(`用户登录成功: ${email}`);
      return { success: true };
      
    } catch (error) {
      authLogger.error(`认证过程出错: ${email}`, error.stack);
      throw error;
    }
  }

  // 模拟方法
  private async mockDatabaseQuery(id: string) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return id === '1' ? { id, username: 'testuser', email: 'test@example.com' } : null;
  }

  private async mockCreateUser(userData: any) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return { id: '123', ...userData };
  }

  private async mockAuthenticate(email: string, password: string) {
    await new Promise(resolve => setTimeout(resolve, 150));
    return password === 'correct';
  }
}

// 2. 在Controller中使用日志
@Controller('example')
export class ExampleController {
  private readonly logger = createModuleLogger('ExampleController');

  constructor(private readonly exampleService: ExampleService) {}

  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    this.logger.info(`接收到获取用户请求: ${id}`);
    
    try {
      const user = await this.exampleService.findUser(id);
      
      if (!user) {
        this.logger.warn(`用户不存在: ${id}`, 'UserNotFound');
        return { success: false, message: '用户不存在' };
      }
      
      return { success: true, data: user };
      
    } catch (error) {
      this.logger.error(`获取用户失败: ${id}`, error.stack);
      throw error;
    }
  }

  @Post('users')
  async createUser(@Body() userData: any) {
    this.logger.info('接收到创建用户请求', {
      email: userData.email,
      username: userData.username
    });
    
    try {
      const user = await this.exampleService.createUser(userData);
      return { success: true, data: user };
      
    } catch (error) {
      this.logger.error('创建用户失败', error.stack);
      throw error;
    }
  }

  @Post('auth/login')
  async login(@Body() loginData: { email: string; password: string }) {
    // 注意：不要记录敏感信息如密码
    this.logger.info('接收到登录请求', { email: loginData.email });
    
    try {
      const result = await this.exampleService.authenticateUser(
        loginData.email, 
        loginData.password
      );
      
      return { success: true, message: '登录成功' };
      
    } catch (error) {
      this.logger.warn('登录失败', 'LoginFailed');
      throw error;
    }
  }
}

// 3. 性能监控示例
export class PerformanceExample {
  private readonly logger = createModuleLogger('Performance');

  async slowOperation() {
    const startTime = Date.now();
    
    try {
      // 模拟耗时操作
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const duration = Date.now() - startTime;
      this.logger.logPerformance('慢操作', duration, 1000);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`操作失败，耗时: ${duration}ms`, error.stack);
      throw error;
    }
  }
}

// 4. 错误处理示例
export class ErrorHandlingExample {
  private readonly logger = createModuleLogger('ErrorHandling');

  async riskyOperation() {
    try {
      // 可能抛出异常的操作
      throw new Error('模拟错误');
      
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('操作失败', error.stack);
      } else {
        this.logger.error('未知错误', String(error));
      }
      
      // 重新抛出或处理错误
      throw error;
    }
  }
}

// 5. 结构化日志示例
export class StructuredLoggingExample {
  private readonly logger = createModuleLogger('StructuredLogging');

  async processOrder(orderId: string, userId: string) {
    const context = {
      orderId,
      userId,
      operation: 'processOrder',
      timestamp: new Date().toISOString()
    };
    
    this.logger.info('开始处理订单', context);
    
    try {
      // 处理订单逻辑
      await this.mockProcessOrder(orderId);
      
      this.logger.info('订单处理成功', {
        ...context,
        status: 'completed'
      });
      
    } catch (error) {
      this.logger.error('订单处理失败', error.stack, 'OrderProcessing');
      
      this.logger.logWithContext(LogLevel.ERROR, '订单处理异常', {
        ...context,
        status: 'failed',
        error: error.message
      });
      
      throw error;
    }
  }

  private async mockProcessOrder(orderId: string) {
    await new Promise(resolve => setTimeout(resolve, 300));
    // 模拟处理逻辑
  }
}