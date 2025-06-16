import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { behaviorTracker } from '../utils/behaviorTracker';
import { logger } from '../utils/logger';

// 需要追踪的路径配置
const TRACKING_CONFIG = {
  // 页面访问追踪
  pageViews: [
    { pattern: /^\/$/, action: 'page_view', target: 'home' },
    { pattern: /^\/articles$/, action: 'page_view', target: 'articles' },
    { pattern: /^\/moments$/, action: 'page_view', target: 'moments' },
    { pattern: /^\/works$/, action: 'page_view', target: 'works' },
    { pattern: /^\/about$/, action: 'page_view', target: 'about' },
    { pattern: /^\/contact$/, action: 'page_view', target: 'contact' },
  ],
  
  // API 访问追踪
  apiViews: [
    { pattern: /^\/api\/articles\/([^/]+)$/, action: 'article_view', extractId: true },
    { pattern: /^\/api\/moments\/([^/]+)$/, action: 'moment_view', extractId: true },
    { pattern: /^\/api\/works\/([^/]+)$/, action: 'work_view', extractId: true },
    { pattern: /^\/api\/users\/([^/]+)$/, action: 'user_visit', extractId: true },
  ],
  
  // 操作追踪
  actions: [
    { pattern: /^\/api\/comments$/, method: 'POST', action: 'comment_create' },
    { pattern: /^\/api\/likes$/, method: 'POST', action: 'like_action' },
    { pattern: /^\/api\/auth\/login$/, method: 'POST', action: 'user_login' },
    { pattern: /^\/api\/auth\/register$/, method: 'POST', action: 'user_register' },
  ]
};

// 不需要追踪的路径
const EXCLUDE_PATTERNS = [
  /^\/api\/admin\//,
  /^\/api\/health$/,
  /^\/_next\//,
  /^\/favicon\.ico$/,
  /^\/robots\.txt$/,
  /^\/sitemap\.xml$/,
  /\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/,
];

// 检查是否需要排除追踪
function shouldExclude(pathname: string): boolean {
  return EXCLUDE_PATTERNS.some(pattern => pattern.test(pathname));
}

// 匹配追踪配置
function matchTrackingConfig(pathname: string, method: string) {
  // 检查页面访问
  for (const config of TRACKING_CONFIG.pageViews) {
    const match = pathname.match(config.pattern);
    if (match) {
      return {
        action: config.action,
        target: config.target,
        targetId: null
      };
    }
  }
  
  // 检查 API 访问
  for (const config of TRACKING_CONFIG.apiViews) {
    const match = pathname.match(config.pattern);
    if (match) {
      return {
        action: config.action,
        target: config.action.replace('_view', '').replace('_visit', ''),
        targetId: config.extractId && match[1] ? match[1] : null
      };
    }
  }
  
  // 检查操作追踪
  for (const config of TRACKING_CONFIG.actions) {
    const match = pathname.match(config.pattern);
    if (match && (!config.method || config.method === method)) {
      return {
        action: config.action,
        target: config.action.replace('_create', '').replace('_action', ''),
        targetId: null
      };
    }
  }
  
  return null;
}

@Injectable()
export class BehaviorTrackingMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const pathname = req.path;
    const method = req.method;
    
    // 检查是否需要排除
    if (shouldExclude(pathname)) {
      return next();
    }
    
    try {
      // 匹配追踪配置
      const trackingConfig = matchTrackingConfig(pathname, method);
      
      if (trackingConfig) {
        // 根据不同的行为类型进行追踪
        switch (trackingConfig.action) {
          case 'page_view':
            await behaviorTracker.trackPageView(
              req,
              trackingConfig.targetId,
              trackingConfig.target
            );
            break;
            
          case 'article_view':
            if (trackingConfig.targetId) {
              await behaviorTracker.trackArticleView(
                req,
                trackingConfig.targetId,
                `Article ${trackingConfig.targetId}`
              );
            }
            break;
            
          case 'moment_view':
            if (trackingConfig.targetId) {
              await behaviorTracker.trackMomentView(
                req,
                trackingConfig.targetId
              );
            }
            break;
            
          case 'work_view':
            if (trackingConfig.targetId) {
              await behaviorTracker.trackWorkView(
                req,
                trackingConfig.targetId,
                `Work ${trackingConfig.targetId}`
              );
            }
            break;
            
          case 'user_visit':
            if (trackingConfig.targetId) {
              await behaviorTracker.trackUserVisit(
                req,
                trackingConfig.targetId
              );
            }
            break;
            
          case 'comment_create':
            // 评论创建需要从请求体中获取更多信息
             // 这里可以根据实际需求进行扩展
             console.log(`Comment create action detected on ${pathname}`);
             break;
             
           case 'like_action':
             // 点赞行为需要从请求体中获取更多信息
             console.log(`Like action detected on ${pathname}`);
             break;
             
           case 'user_login':
           case 'user_register':
             // 用户登录/注册行为
             console.log(`${trackingConfig.action} detected on ${pathname}`);
             break;
             
           default:
             console.log(`Unknown tracking action: ${trackingConfig.action}`);
        }
      }
    } catch (error) {
      // 追踪失败不应该影响正常请求
       logger.logError({
         level: 'error',
         message: 'Behavior tracking failed',
         stack: error instanceof Error ? error.stack : String(error)
       });
    }
    
    next();
  }
}