import { Request } from 'express';
import { logger, BehaviorType } from './logger';
import { UAParser } from 'ua-parser-js';

// 设备信息接口
interface DeviceInfo {
  device: string;
  browser: string;
  os: string;
}

// 地理位置信息接口
interface GeoInfo {
  country?: string;
  city?: string;
}

// 行为追踪器类
export class BehaviorTracker {
  private static instance: BehaviorTracker;

  private constructor() {}

  public static getInstance(): BehaviorTracker {
    if (!BehaviorTracker.instance) {
      BehaviorTracker.instance = new BehaviorTracker();
    }
    return BehaviorTracker.instance;
  }

  // 解析用户代理信息
  private parseUserAgent(userAgent: string): DeviceInfo {
    const result = UAParser(userAgent);

    return {
      device: this.getDeviceType(result),
      browser: `${result.browser.name || 'Unknown'} ${result.browser.version || ''}`.trim(),
      os: `${result.os.name || 'Unknown'} ${result.os.version || ''}`.trim()
    };
  }

  // 获取设备类型
  private getDeviceType(result: UAParser.IResult): string {
    if (result.device.type) {
      return result.device.type;
    }
    
    // 根据操作系统判断设备类型
    const os = result.os.name?.toLowerCase() || '';
    if (os.includes('android') || os.includes('ios')) {
      return 'mobile';
    } else if (os.includes('mac') || os.includes('windows') || os.includes('linux')) {
      return 'desktop';
    }
    
    return 'unknown';
  }

  // 获取客户端IP地址
  private getClientIP(request: Request): string {
    // 尝试从各种头部获取真实IP
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      const forwardedStr = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      return forwardedStr.split(',')[0].trim();
    }

    const realIP = request.headers['x-real-ip'];
    if (realIP) {
      return Array.isArray(realIP) ? realIP[0] : realIP;
    }

    const cfConnectingIP = request.headers['cf-connecting-ip'];
    if (cfConnectingIP) {
      return Array.isArray(cfConnectingIP) ? cfConnectingIP[0] : cfConnectingIP;
    }

    // 如果都没有，返回默认值
    return request.ip || '127.0.0.1';
  }

  // 获取会话ID（从cookie或生成新的）
  private getSessionId(request: Request): string {
    const sessionId = request.cookies?.session_id;
    if (sessionId) {
      return sessionId;
    }

    // 生成新的会话ID
    return this.generateSessionId();
  }

  // 生成会话ID
  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 获取地理位置信息（可以集成第三方IP地理位置服务）
  private async getGeoInfo(_ip: string): Promise<GeoInfo> {
    // 这里可以集成如 MaxMind、ipapi.co 等服务
    // 暂时返回空对象，可以后续扩展
    try {
      // 示例：使用免费的 ipapi.co 服务
      // const response = await fetch(`https://ipapi.co/${_ip}/json/`);
      // const data = await response.json();
      // return {
      //   country: data.country_name,
      //   city: data.city
      // };
      
      return {};
    } catch (error) {
      console.error('获取地理位置信息失败:', error);
      return {};
    }
  }

  // 记录页面访问
  public async trackPageView(request: Request, targetId?: string, targetTitle?: string): Promise<void> {
    const userAgent = (Array.isArray(request.headers['user-agent']) ? request.headers['user-agent'][0] : request.headers['user-agent']) || '';
    const referer = (Array.isArray(request.headers['referer']) ? request.headers['referer'][0] : request.headers['referer']) || undefined;
    const ip = this.getClientIP(request);
    const sessionId = this.getSessionId(request);
    const deviceInfo = this.parseUserAgent(userAgent);
    const geoInfo = await this.getGeoInfo(ip);

    logger.logBehavior({
      type: BehaviorType.PAGE_VIEW,
      targetId,
      targetTitle,
      sessionId,
      ipAddress: ip,
      userAgent,
      referer,
      country: geoInfo.country,
      city: geoInfo.city,
      device: deviceInfo.device,
      browser: deviceInfo.browser,
      os: deviceInfo.os
    });
  }

  // 记录文章访问
  public async trackArticleView(
    request: Request,
    articleId: string,
    articleTitle: string,
    userId?: string
  ): Promise<void> {
    const userAgent = (Array.isArray(request.headers['user-agent']) ? request.headers['user-agent'][0] : request.headers['user-agent']) || '';
    const referer = (Array.isArray(request.headers['referer']) ? request.headers['referer'][0] : request.headers['referer']) || undefined;
    const ip = this.getClientIP(request);
    const sessionId = this.getSessionId(request);
    const deviceInfo = this.parseUserAgent(userAgent);
    const geoInfo = await this.getGeoInfo(ip);

    logger.logBehavior({
      type: BehaviorType.ARTICLE_VIEW,
      targetId: articleId,
      targetTitle: articleTitle,
      userId,
      sessionId,
      ipAddress: ip,
      userAgent,
      referer,
      country: geoInfo.country,
      city: geoInfo.city,
      device: deviceInfo.device,
      browser: deviceInfo.browser,
      os: deviceInfo.os
    });
  }

  // 记录动态访问
  public async trackMomentView(
    request: Request,
    momentId: string,
    userId?: string
  ): Promise<void> {
    const userAgent = (Array.isArray(request.headers['user-agent']) ? request.headers['user-agent'][0] : request.headers['user-agent']) || '';
    const referer = (Array.isArray(request.headers['referer']) ? request.headers['referer'][0] : request.headers['referer']) || undefined;
    const ip = this.getClientIP(request);
    const sessionId = this.getSessionId(request);
    const deviceInfo = this.parseUserAgent(userAgent);
    const geoInfo = await this.getGeoInfo(ip);

    logger.logBehavior({
      type: BehaviorType.MOMENT_VIEW,
      targetId: momentId,
      userId,
      sessionId,
      ipAddress: ip,
      userAgent,
      referer,
      country: geoInfo.country,
      city: geoInfo.city,
      device: deviceInfo.device,
      browser: deviceInfo.browser,
      os: deviceInfo.os
    });
  }

  // 记录作品访问
  public async trackWorkView(
    request: Request,
    workId: string,
    workTitle: string,
    userId?: string
  ): Promise<void> {
    const userAgent = (Array.isArray(request.headers['user-agent']) ? request.headers['user-agent'][0] : request.headers['user-agent']) || '';
    const referer = (Array.isArray(request.headers['referer']) ? request.headers['referer'][0] : request.headers['referer']) || undefined;
    const ip = this.getClientIP(request);
    const sessionId = this.getSessionId(request);
    const deviceInfo = this.parseUserAgent(userAgent);
    const geoInfo = await this.getGeoInfo(ip);

    logger.logBehavior({
      type: BehaviorType.WORK_VIEW,
      targetId: workId,
      targetTitle: workTitle,
      userId,
      sessionId,
      ipAddress: ip,
      userAgent,
      referer,
      country: geoInfo.country,
      city: geoInfo.city,
      device: deviceInfo.device,
      browser: deviceInfo.browser,
      os: deviceInfo.os
    });
  }

  // 记录用户访问
  public async trackUserVisit(request: Request, userId?: string): Promise<void> {
    const userAgent = (Array.isArray(request.headers['user-agent']) ? request.headers['user-agent'][0] : request.headers['user-agent']) || '';
    const referer = (Array.isArray(request.headers['referer']) ? request.headers['referer'][0] : request.headers['referer']) || undefined;
    const ip = this.getClientIP(request);
    const sessionId = this.getSessionId(request);
    const deviceInfo = this.parseUserAgent(userAgent);
    const geoInfo = await this.getGeoInfo(ip);

    logger.logBehavior({
      type: BehaviorType.USER_VISIT,
      userId,
      sessionId,
      ipAddress: ip,
      userAgent,
      referer,
      country: geoInfo.country,
      city: geoInfo.city,
      device: deviceInfo.device,
      browser: deviceInfo.browser,
      os: deviceInfo.os
    });
  }

  // 记录评论创建
  public async trackCommentCreate(
    request: Request,
    targetType: string,
    targetId: string,
    userId?: string
  ): Promise<void> {
    const userAgent = (Array.isArray(request.headers['user-agent']) ? request.headers['user-agent'][0] : request.headers['user-agent']) || '';
    const referer = (Array.isArray(request.headers['referer']) ? request.headers['referer'][0] : request.headers['referer']) || undefined;
    const ip = this.getClientIP(request);
    const sessionId = this.getSessionId(request);
    const deviceInfo = this.parseUserAgent(userAgent);
    const geoInfo = await this.getGeoInfo(ip);

    logger.logBehavior({
      type: BehaviorType.COMMENT_CREATE,
      targetId,
      userId,
      sessionId,
      ipAddress: ip,
      userAgent,
      referer,
      country: geoInfo.country,
      city: geoInfo.city,
      device: deviceInfo.device,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      extra: {
        targetType
      }
    });
  }

  // 记录点赞行为
  public async trackLikeAction(
    request: Request,
    targetType: string,
    targetId: string,
    action: 'like' | 'unlike',
    userId?: string
  ): Promise<void> {
    const userAgent = (Array.isArray(request.headers['user-agent']) ? request.headers['user-agent'][0] : request.headers['user-agent']) || '';
    const referer = (Array.isArray(request.headers['referer']) ? request.headers['referer'][0] : request.headers['referer']) || undefined;
    const ip = this.getClientIP(request);
    const sessionId = this.getSessionId(request);
    const deviceInfo = this.parseUserAgent(userAgent);
    const geoInfo = await this.getGeoInfo(ip);

    logger.logBehavior({
      type: BehaviorType.LIKE_ACTION,
      targetId,
      userId,
      sessionId,
      ipAddress: ip,
      userAgent,
      referer,
      country: geoInfo.country,
      city: geoInfo.city,
      device: deviceInfo.device,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      extra: {
        targetType,
        action
      }
    });
  }
}

// 导出单例实例
export const behaviorTracker = BehaviorTracker.getInstance();