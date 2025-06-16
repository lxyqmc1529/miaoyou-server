# 日志系统使用指南

本项目集成了基于 Winston 的完善日志系统，提供结构化日志记录、性能监控、错误追踪等功能。

## 目录

- [功能特性](#功能特性)
- [日志级别](#日志级别)
- [基本使用](#基本使用)
- [高级功能](#高级功能)
- [配置说明](#配置说明)
- [日志文件结构](#日志文件结构)
- [最佳实践](#最佳实践)
- [故障排除](#故障排除)

## 功能特性

### ✅ 已实现功能

- **多级别日志记录**: error, warn, info, http, debug
- **结构化日志**: JSON 格式，便于分析和查询
- **文件轮转**: 按大小和日期自动轮转日志文件
- **性能监控**: 自动记录慢请求和慢查询
- **HTTP 请求日志**: 自动记录所有 API 请求
- **数据库操作日志**: 记录数据库查询性能
- **安全事件日志**: 记录认证和授权相关事件
- **全局异常捕获**: 自动记录未处理的异常
- **敏感信息过滤**: 自动过滤密码等敏感数据
- **多环境支持**: 开发和生产环境不同配置

## 日志级别

```typescript
export enum LogLevel {
  ERROR = 'error',    // 错误信息
  WARN = 'warn',      // 警告信息
  INFO = 'info',      // 一般信息
  HTTP = 'http',      // HTTP 请求信息
  DEBUG = 'debug'     // 调试信息
}
```

## 基本使用

### 1. 导入日志器

```typescript
import { 
  appLogger,           // 应用通用日志器
  authLogger,          // 认证相关日志器
  dbLogger,            // 数据库相关日志器
  securityLogger,      // 安全相关日志器
  createModuleLogger   // 创建模块专用日志器
} from '../utils/winston-logger';
```

### 2. 在 Service 中使用

```typescript
@Injectable()
export class UserService {
  private readonly logger = createModuleLogger('UserService');

  async findUser(id: string) {
    this.logger.info(`查找用户: ${id}`);
    
    try {
      const user = await this.userRepository.findOne({ where: { id } });
      
      if (!user) {
        this.logger.warn(`用户不存在: ${id}`);
        return null;
      }
      
      this.logger.info(`找到用户: ${id}`, { 
        userId: id, 
        username: user.username 
      });
      
      return user;
    } catch (error) {
      this.logger.error(`查找用户失败: ${id}`, error.stack);
      throw error;
    }
  }
}
```

### 3. 在 Controller 中使用

```typescript
@Controller('users')
export class UserController {
  private readonly logger = createModuleLogger('UserController');

  @Get(':id')
  async getUser(@Param('id') id: string) {
    this.logger.info(`接收获取用户请求: ${id}`);
    
    try {
      const user = await this.userService.findUser(id);
      return { success: true, data: user };
    } catch (error) {
      this.logger.error(`获取用户失败: ${id}`, error.stack);
      throw error;
    }
  }
}
```

## 高级功能

### 1. 结构化日志记录

```typescript
// 记录带上下文的日志
this.logger.logWithContext('info', '用户操作', {
  userId: '123',
  action: 'update_profile',
  ip: '192.168.1.1',
  timestamp: new Date().toISOString()
});
```

### 2. 性能监控

```typescript
// 自动记录慢操作
const startTime = Date.now();
// ... 执行操作
const duration = Date.now() - startTime;
this.logger.logPerformance('数据处理', duration, 1000); // 阈值1秒
```

### 3. 数据库操作日志

```typescript
// 记录数据库操作
this.logger.logDatabase('SELECT', 'users', duration);
this.logger.logDatabase('INSERT', 'articles', duration, error);
```

### 4. 业务逻辑日志

```typescript
// 记录业务操作
this.logger.logBusiness('用户注册', {
  email: user.email,
  source: 'web',
  referrer: req.get('Referer')
}, user.id);
```

### 5. 安全事件日志

```typescript
// 记录安全相关事件
securityLogger.logSecurity('登录失败', {
  email: loginData.email,
  ip: req.ip,
  userAgent: req.get('User-Agent'),
  reason: '密码错误'
});
```

## 配置说明

### 环境变量配置

在 `.env` 文件中添加以下配置：

```env
# 日志级别 (error, warn, info, http, debug)
LOG_LEVEL=info

# 日志文件配置
LOG_MAX_FILE_SIZE=20m
LOG_MAX_FILES=14
LOG_DATE_PATTERN=YYYY-MM-DD
LOG_ZIPPED_ARCHIVE=true
LOG_DIRECTORY=logs

# 功能开关
LOG_ENABLE_CONSOLE=true
LOG_ENABLE_FILE=true
LOG_ENABLE_ROTATION=true

# 性能阈值配置
SLOW_REQUEST_THRESHOLD=1000
SLOW_QUERY_THRESHOLD=500
SLOW_BUSINESS_THRESHOLD=2000
```

### 代码配置

```typescript
// 在 src/config/logger.config.ts 中修改配置
export const getLoggerConfig = (): LoggerConfig => {
  return {
    level: 'debug',
    maxFileSize: '50m',
    maxFiles: 30,
    // ... 其他配置
  };
};
```

## 日志文件结构

```
logs/
├── combined.log              # 所有级别的日志
├── error.log                 # 错误日志
├── http.log                  # HTTP 请求日志
├── exceptions.log            # 未捕获异常
├── rejections.log            # 未处理的 Promise 拒绝
└── application-2024-01-15.log # 按日期分割的日志（生产环境）
```

### 日志格式示例

```json
{
  "timestamp": "2024-01-15 10:30:45",
  "level": "info",
  "message": "用户登录成功",
  "context": "AuthService",
  "userId": "123",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

## 最佳实践

### 1. 日志级别使用指南

- **ERROR**: 系统错误、异常情况
- **WARN**: 警告信息、潜在问题
- **INFO**: 重要的业务流程信息
- **HTTP**: HTTP 请求响应信息
- **DEBUG**: 调试信息、详细的执行流程

### 2. 敏感信息处理

```typescript
// ❌ 错误：记录敏感信息
this.logger.info('用户登录', { 
  email: user.email, 
  password: user.password  // 不要记录密码
});

// ✅ 正确：过滤敏感信息
this.logger.info('用户登录', { 
  email: user.email,
  userId: user.id
});
```

### 3. 结构化日志

```typescript
// ✅ 推荐：使用结构化数据
this.logger.info('订单创建', {
  orderId: order.id,
  userId: order.userId,
  amount: order.amount,
  status: order.status
});

// ❌ 不推荐：纯文本日志
this.logger.info(`订单 ${order.id} 创建成功，金额 ${order.amount}`);
```

### 4. 错误处理

```typescript
try {
  await someOperation();
} catch (error) {
  // 记录完整的错误信息和堆栈
  this.logger.error('操作失败', error.stack, 'OperationContext');
  
  // 重新抛出或适当处理
  throw error;
}
```

### 5. 性能监控

```typescript
const startTime = Date.now();
try {
  const result = await expensiveOperation();
  const duration = Date.now() - startTime;
  
  // 记录性能信息
  this.logger.logPerformance('昂贵操作', duration, 2000);
  
  return result;
} catch (error) {
  const duration = Date.now() - startTime;
  this.logger.error(`操作失败，耗时: ${duration}ms`, error.stack);
  throw error;
}
```

## 故障排除

### 1. 日志文件权限问题

```bash
# 确保日志目录有写权限
sudo chmod 755 logs/
sudo chown -R $USER:$USER logs/
```

### 2. 日志文件过大

```typescript
// 调整文件大小限制
const config = {
  maxsize: 10485760, // 10MB
  maxFiles: 10
};
```

### 3. 性能问题

```typescript
// 在生产环境中调整日志级别
if (process.env.NODE_ENV === 'production') {
  logger.level = 'warn'; // 只记录警告和错误
}
```

### 4. 查看日志

```bash
# 查看最新日志
tail -f logs/combined.log

# 查看错误日志
tail -f logs/error.log

# 搜索特定内容
grep "ERROR" logs/combined.log

# 查看 JSON 格式日志
cat logs/combined.log | jq '.'
```

## 监控和分析

### 1. 日志分析工具

推荐使用以下工具分析日志：

- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Grafana + Loki**
- **Fluentd**
- **Winston 的查询功能**

### 2. 告警设置

可以基于日志内容设置告警：

- 错误率超过阈值
- 响应时间过长
- 安全事件频发
- 系统异常

### 3. 性能指标

通过日志可以监控：

- API 响应时间
- 数据库查询性能
- 错误率统计
- 用户行为分析

---

## 相关文件

- `src/utils/winston-logger.ts` - 核心日志器实现
- `src/middleware/logger.middleware.ts` - HTTP 请求日志中间件
- `src/filters/logger-exception.filter.ts` - 全局异常过滤器
- `src/config/logger.config.ts` - 日志配置
- `src/examples/logger-usage.example.ts` - 使用示例

如有问题，请参考示例代码或联系开发团队。