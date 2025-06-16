export interface LoggerConfig {
  level: string;
  maxFileSize: string;
  maxFiles: number;
  datePattern: string;
  zippedArchive: boolean;
  enableConsole: boolean;
  enableFile: boolean;
  enableRotation: boolean;
  logDirectory: string;
}

export const getLoggerConfig = (): LoggerConfig => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
    maxFileSize: process.env.LOG_MAX_FILE_SIZE || '20m',
    maxFiles: parseInt(process.env.LOG_MAX_FILES || '14'),
    datePattern: process.env.LOG_DATE_PATTERN || 'YYYY-MM-DD',
    zippedArchive: process.env.LOG_ZIPPED_ARCHIVE === 'true' || isProduction,
    enableConsole: process.env.LOG_ENABLE_CONSOLE !== 'false',
    enableFile: process.env.LOG_ENABLE_FILE !== 'false',
    enableRotation: process.env.LOG_ENABLE_ROTATION !== 'false' || isProduction,
    logDirectory: process.env.LOG_DIRECTORY || 'logs',
  };
};

// 日志级别配置
export const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// 敏感信息过滤配置
export const SENSITIVE_FIELDS = [
  'password',
  'token',
  'authorization',
  'cookie',
  'secret',
  'key',
  'apikey',
  'api_key',
  'access_token',
  'refresh_token',
];

// 需要记录的HTTP状态码
export const LOG_STATUS_CODES = {
  // 成功响应
  success: [200, 201, 202, 204],
  // 客户端错误
  clientError: [400, 401, 403, 404, 409, 422],
  // 服务器错误
  serverError: [500, 501, 502, 503, 504],
};

// 慢请求阈值配置
export const PERFORMANCE_THRESHOLDS = {
  // HTTP请求响应时间阈值（毫秒）
  httpRequest: parseInt(process.env.SLOW_REQUEST_THRESHOLD || '1000'),
  // 数据库查询时间阈值（毫秒）
  databaseQuery: parseInt(process.env.SLOW_QUERY_THRESHOLD || '500'),
  // 业务逻辑处理时间阈值（毫秒）
  businessLogic: parseInt(process.env.SLOW_BUSINESS_THRESHOLD || '2000'),
};