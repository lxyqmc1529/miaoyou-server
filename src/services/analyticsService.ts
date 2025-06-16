import { logger, BehaviorLog, LogType, BehaviorType } from '../utils/logger';
import { AppDataSource } from '../config/database';
import { Analytics, DailyStats } from '../entities/Analytics';
import { Repository } from 'typeorm';

// 统计数据接口
interface DailyStatistics {
  date: string;
  totalViews: number;
  uniqueVisitors: number;
  articleViews: number;
  momentViews: number;
  workViews: number;
  newComments: number;
  newLikes: number;
  topPages: Array<{ path: string; views: number }>;
  topArticles: Array<{ id: string; title: string; views: number }>;
  deviceStats: Record<string, number>;
  browserStats: Record<string, number>;
  osStats: Record<string, number>;
  countryStats: Record<string, number>;
}

// 分析服务类
export class AnalyticsService {
  private analyticsRepo: Repository<Analytics>;
  private dailyStatsRepo: Repository<DailyStats>;

  constructor() {
    this.analyticsRepo = AppDataSource.getRepository(Analytics);
    this.dailyStatsRepo = AppDataSource.getRepository(DailyStats);
  }

  // 处理指定日期的行为日志
  public async processDailyLogs(date: string): Promise<void> {
    try {
      console.log(`开始处理 ${date} 的行为日志...`);
      
      // 读取行为日志
      const behaviorLogs = logger.readLogs(LogType.BEHAVIOR, date);
      
      if (behaviorLogs.length === 0) {
        console.log(`${date} 没有行为日志数据`);
        return;
      }

      // 生成统计数据
      const statistics = this.generateStatistics(behaviorLogs as BehaviorLog[], date);
      
      // 保存详细分析数据
      await this.saveDetailedAnalytics(behaviorLogs as BehaviorLog[], date);
      
      // 保存每日统计数据
      await this.saveDailyStatistics(statistics);
      
      console.log(`${date} 的日志处理完成，共处理 ${behaviorLogs.length} 条记录`);
    } catch (error) {
      console.error(`处理 ${date} 日志时出错:`, error);
      throw error;
    }
  }

  // 生成统计数据
  private generateStatistics(logs: BehaviorLog[], date: string): DailyStatistics {
    const uniqueVisitors = new Set<string>();
    const deviceStats: Record<string, number> = {};
    const browserStats: Record<string, number> = {};
    const osStats: Record<string, number> = {};
    const countryStats: Record<string, number> = {};
    const pageViews: Record<string, number> = {};
    const articleViews: Record<string, { title: string; views: number }> = {};
    
    let totalViews = 0;
    let articleViewCount = 0;
    let momentViewCount = 0;
    let workViewCount = 0;
    let commentCount = 0;
    let likeCount = 0;

    logs.forEach(log => {
      // 统计唯一访客
      if (log.sessionId) {
        uniqueVisitors.add(log.sessionId);
      }

      // 统计设备信息
      if (log.device) {
        deviceStats[log.device] = (deviceStats[log.device] || 0) + 1;
      }
      if (log.browser) {
        browserStats[log.browser] = (browserStats[log.browser] || 0) + 1;
      }
      if (log.os) {
        osStats[log.os] = (osStats[log.os] || 0) + 1;
      }
      if (log.country) {
        countryStats[log.country] = (countryStats[log.country] || 0) + 1;
      }

      // 统计行为类型
      switch (log.type) {
        case BehaviorType.PAGE_VIEW:
          totalViews++;
          if (log.referer) {
            pageViews[log.referer] = (pageViews[log.referer] || 0) + 1;
          }
          break;
        case BehaviorType.ARTICLE_VIEW:
          articleViewCount++;
          totalViews++;
          if (log.targetId && log.targetTitle) {
            if (!articleViews[log.targetId]) {
              articleViews[log.targetId] = { title: log.targetTitle, views: 0 };
            }
            articleViews[log.targetId].views++;
          }
          break;
        case BehaviorType.MOMENT_VIEW:
          momentViewCount++;
          totalViews++;
          break;
        case BehaviorType.WORK_VIEW:
          workViewCount++;
          totalViews++;
          break;
        case BehaviorType.COMMENT_CREATE:
          commentCount++;
          break;
        case BehaviorType.LIKE_ACTION:
          likeCount++;
          break;
      }
    });

    // 生成热门页面排行
    const topPages = Object.entries(pageViews)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([path, views]) => ({ path, views }));

    // 生成热门文章排行
    const topArticles = Object.entries(articleViews)
      .sort(([, a], [, b]) => b.views - a.views)
      .slice(0, 10)
      .map(([id, data]) => ({ id, title: data.title, views: data.views }));

    return {
      date,
      totalViews,
      uniqueVisitors: uniqueVisitors.size,
      articleViews: articleViewCount,
      momentViews: momentViewCount,
      workViews: workViewCount,
      newComments: commentCount,
      newLikes: likeCount,
      topPages,
      topArticles,
      deviceStats,
      browserStats,
      osStats,
      countryStats
    };
  }

  // 保存详细分析数据
  private async saveDetailedAnalytics(logs: BehaviorLog[], date: string): Promise<void> {
    const analyticsData: Partial<Analytics>[] = [];

    logs.forEach(log => {
      analyticsData.push({
        date,
        type: log.type as 'page_view' | 'article_view' | 'work_view' | 'moment_view',
        targetId: log.targetId,
        targetTitle: log.targetTitle,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        referer: log.referer,
        country: log.country,
        city: log.city,
        device: log.device,
        browser: log.browser,
        os: log.os,
        createdAt: new Date(log.timestamp)
      });
    });

    // 批量插入，每次处理1000条
    const batchSize = 1000;
    for (let i = 0; i < analyticsData.length; i += batchSize) {
      const batch = analyticsData.slice(i, i + batchSize);
      await this.analyticsRepo.save(batch);
    }
  }

  // 保存每日统计数据
  private async saveDailyStatistics(statistics: DailyStatistics): Promise<void> {
    // 检查是否已存在该日期的统计数据
    let dailyStats = await this.dailyStatsRepo.findOne({
      where: { date: statistics.date }
    });

    if (dailyStats) {
      // 更新现有数据
      Object.assign(dailyStats, {
        totalViews: statistics.totalViews,
        uniqueVisitors: statistics.uniqueVisitors,
        articleViews: statistics.articleViews,
        momentViews: statistics.momentViews,
        workViews: statistics.workViews,
        newComments: statistics.newComments,
        newLikes: statistics.newLikes,
        updatedAt: new Date()
      });
    } else {
      // 创建新数据
      dailyStats = this.dailyStatsRepo.create({
        date: statistics.date,
        totalViews: statistics.totalViews,
        uniqueVisitors: statistics.uniqueVisitors,
        articleViews: statistics.articleViews,
        momentViews: statistics.momentViews,
        workViews: statistics.workViews,
        newComments: statistics.newComments,
        newLikes: statistics.newLikes
      });
    }

    await this.dailyStatsRepo.save(dailyStats);
  }

  // 获取统计数据
  public async getStatistics(startDate: string, endDate: string): Promise<DailyStats[]> {
    return await this.dailyStatsRepo
      .createQueryBuilder('stats')
      .where('stats.date >= :startDate', { startDate })
      .andWhere('stats.date <= :endDate', { endDate })
      .orderBy('stats.date', 'ASC')
      .getMany();
  }

  // 获取热门内容
  public async getTopContent(date: string, type: string, limit: number = 10): Promise<Array<{ targetId: string; targetTitle: string; views: number }>> {
    return await this.analyticsRepo
      .createQueryBuilder('analytics')
      .select(['analytics.targetId', 'analytics.targetTitle', 'COUNT(*) as views'])
      .where('analytics.date = :date', { date })
      .andWhere('analytics.type = :type', { type })
      .andWhere('analytics.targetId IS NOT NULL')
      .groupBy('analytics.targetId, analytics.targetTitle')
      .orderBy('views', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  /**
   * 清理旧的分析数据
   */
  async cleanupOldAnalytics(retentionDays: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      // 清理旧的详细分析数据
      await AppDataSource.getRepository(Analytics)
        .createQueryBuilder()
        .delete()
        .where('createdAt < :cutoffDate', { cutoffDate })
        .execute();
      
      // 清理旧的每日统计数据
      await AppDataSource.getRepository(DailyStats)
        .createQueryBuilder()
        .delete()
        .where('createdAt < :cutoffDate', { cutoffDate })
        .execute();
      
      console.log(`已清理 ${retentionDays} 天前的分析数据`);
    } catch (error) {
      console.error('清理分析数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取每日统计数据
   */
  async getDailyStats(startDate?: string, endDate?: string, limit: number = 30) {
    const query = AppDataSource.getRepository(DailyStats)
      .createQueryBuilder('stats')
      .orderBy('stats.date', 'DESC');
    
    if (startDate) {
      query.andWhere('stats.date >= :startDate', { startDate });
    }
    
    if (endDate) {
      query.andWhere('stats.date <= :endDate', { endDate });
    }
    
    return await query.limit(limit).getMany();
  }

  /**
   * 获取统计摘要
   */
  async getStatsSummary(startDate?: string, endDate?: string) {
    const query = AppDataSource.getRepository(DailyStats)
      .createQueryBuilder('stats')
      .select([
        'SUM(stats.totalViews) as totalViews',
        'SUM(stats.uniqueVisitors) as uniqueVisitors',
        'SUM(stats.articleViews) as articleViews',
        'SUM(stats.momentViews) as momentViews',
        'SUM(stats.workViews) as workViews',
        'AVG(stats.totalViews) as avgDailyViews'
      ]);
    
    if (startDate) {
      query.andWhere('stats.date >= :startDate', { startDate });
    }
    
    if (endDate) {
      query.andWhere('stats.date <= :endDate', { endDate });
    }
    
    return await query.getRawOne();
  }

  /**
   * 获取热门文章
   */
  async getTopArticles(startDate?: string, endDate?: string, limit: number = 10) {
    const query = AppDataSource.getRepository(Analytics)
      .createQueryBuilder('analytics')
      .select([
        'analytics.targetId',
        'COUNT(*) as viewCount'
      ])
      .where('analytics.action = :action', { action: 'article_view' })
      .groupBy('analytics.targetId')
      .orderBy('viewCount', 'DESC');
    
    if (startDate) {
      query.andWhere('analytics.createdAt >= :startDate', { startDate });
    }
    
    if (endDate) {
      query.andWhere('analytics.createdAt <= :endDate', { endDate });
    }
    
    return await query.limit(limit).getRawMany();
  }

  /**
   * 获取热门动态
   */
  async getTopMoments(startDate?: string, endDate?: string, limit: number = 10) {
    const query = AppDataSource.getRepository(Analytics)
      .createQueryBuilder('analytics')
      .select([
        'analytics.targetId',
        'COUNT(*) as viewCount'
      ])
      .where('analytics.action = :action', { action: 'moment_view' })
      .groupBy('analytics.targetId')
      .orderBy('viewCount', 'DESC');
    
    if (startDate) {
      query.andWhere('analytics.createdAt >= :startDate', { startDate });
    }
    
    if (endDate) {
      query.andWhere('analytics.createdAt <= :endDate', { endDate });
    }
    
    return await query.limit(limit).getRawMany();
  }

  /**
   * 获取热门作品
   */
  async getTopWorks(startDate?: string, endDate?: string, limit: number = 10) {
    const query = AppDataSource.getRepository(Analytics)
      .createQueryBuilder('analytics')
      .select([
        'analytics.targetId',
        'COUNT(*) as viewCount'
      ])
      .where('analytics.action = :action', { action: 'work_view' })
      .groupBy('analytics.targetId')
      .orderBy('viewCount', 'DESC');
    
    if (startDate) {
      query.andWhere('analytics.createdAt >= :startDate', { startDate });
    }
    
    if (endDate) {
      query.andWhere('analytics.createdAt <= :endDate', { endDate });
    }
    
    return await query.limit(limit).getRawMany();
  }

  /**
   * 获取用户活动统计
   */
  async getUserActivityStats(startDate?: string, endDate?: string, limit: number = 10) {
    const query = AppDataSource.getRepository(Analytics)
      .createQueryBuilder('analytics')
      .select([
        'analytics.userId',
        'COUNT(*) as activityCount',
        'COUNT(DISTINCT analytics.action) as actionTypes'
      ])
      .where('analytics.userId IS NOT NULL')
      .groupBy('analytics.userId')
      .orderBy('activityCount', 'DESC');
    
    if (startDate) {
      query.andWhere('analytics.createdAt >= :startDate', { startDate });
    }
    
    if (endDate) {
      query.andWhere('analytics.createdAt <= :endDate', { endDate });
    }
    
    return await query.limit(limit).getRawMany();
  }

  /**
   * 生成自定义报告
   */
  async generateCustomReport(options: {
    startDate: string;
    endDate: string;
    metrics: string[];
    groupBy: string;
    filters?: Record<string, string | number | boolean>;
  }) {
    const { startDate, endDate, metrics, groupBy } = options;
    
    // 这里可以根据需求实现复杂的自定义报告逻辑
    // 暂时返回基础统计数据
    const summary = await this.getStatsSummary(startDate, endDate);
    const dailyStats = await this.getDailyStats(startDate, endDate);
    
    return {
      summary,
      dailyStats,
      period: { startDate, endDate },
      metrics,
      groupBy
    };
  }
}

// 导出服务实例
export const analyticsService = new AnalyticsService();