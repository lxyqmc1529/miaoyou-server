import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, MoreThan } from 'typeorm';

import { Article } from '../../entities/Article';
import { Category } from '../../entities/Category';
import { User } from '../../entities/User';
import { Analytics } from '../../entities/Analytics';
import { CreateArticleDto, UpdateArticleDto, ArticlePaginationDto } from './dto/articles.dto';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Analytics)
    private analyticsRepository: Repository<Analytics>,
  ) {}

  async findAll(paginationDto: ArticlePaginationDto, isPublic = false) {
    const { page, limit, search, sortBy, sortOrder, categoryId, tag, status, authorId } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.articleRepository.createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author')
      .leftJoinAndSelect('article.category', 'category');

    // 公开接口只显示已发布的文章
    if (isPublic) {
      queryBuilder.where('article.status = :status', { status: 'published' });
    } else if (status) {
      queryBuilder.where('article.status = :status', { status });
    }

    // 搜索功能
    if (search) {
      queryBuilder.andWhere(
        '(article.title LIKE :search OR article.summary LIKE :search OR article.content LIKE :search)',
        { search: `%${search}%` }
      );
    }

    // 分类筛选
    if (categoryId) {
      queryBuilder.andWhere('article.categoryId = :categoryId', { categoryId });
    }

    // 标签筛选
    if (tag) {
      queryBuilder.andWhere('article.tags LIKE :tag', { tag: `%${tag}%` });
    }

    // 作者筛选
    if (authorId) {
      queryBuilder.andWhere('article.authorId = :authorId', { authorId });
    }

    // 排序
    const sortField = sortBy === 'category' ? 'category.name' : 
                     sortBy === 'author' ? 'author.username' : 
                     `article.${sortBy}`;
    queryBuilder.orderBy(sortField, sortOrder);

    // 分页
    queryBuilder.skip(skip).take(limit);

    const [articles, total] = await queryBuilder.getManyAndCount();

    return {
      data: articles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, isPublic = false) {
    const queryBuilder = this.articleRepository.createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author')
      .leftJoinAndSelect('article.category', 'category')
      .where('article.id = :id', { id });

    // 公开接口只显示已发布的文章
    if (isPublic) {
      queryBuilder.andWhere('article.status = :status', { status: 'published' });
    }

    const article = await queryBuilder.getOne();
    if (!article) {
      throw new NotFoundException('文章不存在');
    }

    return article;
  }

  async create(createArticleDto: CreateArticleDto, authorId: string) {
    // 验证分类是否存在
    if (createArticleDto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: createArticleDto.categoryId }
      });
      if (!category) {
        throw new NotFoundException('分类不存在');
      }
    }

    const article = this.articleRepository.create({
      ...createArticleDto,
      authorId,
      publishedAt: createArticleDto.status === 'published' ? new Date() : undefined,
    });

    return this.articleRepository.save(article);
  }

  async update(id: string, updateArticleDto: UpdateArticleDto, userId?: string, userRole?: string) {
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!article) {
      throw new NotFoundException('文章不存在');
    }

    // 权限检查：只有作者或管理员可以编辑
    if (userId && userRole !== 'admin' && article.authorId !== userId) {
      throw new ForbiddenException('无权限编辑此文章');
    }

    // 验证分类是否存在
    if (updateArticleDto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: updateArticleDto.categoryId }
      });
      if (!category) {
        throw new NotFoundException('分类不存在');
      }
    }

    // 如果状态改为已发布且之前未发布，设置发布时间
    if (updateArticleDto.status === 'published' && article.status !== 'published') {
      updateArticleDto.publishedAt = new Date();
    }

    await this.articleRepository.update(id, updateArticleDto);
    return this.findOne(id);
  }

  async remove(id: string, userId?: string, userRole?: string) {
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!article) {
      throw new NotFoundException('文章不存在');
    }

    // 权限检查：只有作者或管理员可以删除
    if (userId && userRole !== 'admin' && article.authorId !== userId) {
      throw new ForbiddenException('无权限删除此文章');
    }

    await this.articleRepository.remove(article);
    return { message: '文章删除成功' };
  }

  async incrementViewCount(id: string, request?: Express.Request) {
    // 增加浏览量
    await this.articleRepository.increment({ id }, 'viewCount', 1);

    // 记录分析数据
    if (request) {
      const article = await this.articleRepository.findOne({ where: { id } });
      if (article) {
        await this.recordAnalytics(request, 'article_view', id, article.title);
      }
    }
  }

  async incrementLikeCount(id: string) {
    const article = await this.articleRepository.findOne({ where: { id } });
    if (!article) {
      throw new NotFoundException('文章不存在');
    }

    await this.articleRepository.increment({ id }, 'likeCount', 1);
    return { message: '点赞成功' };
  }

  async getRecommended(limit = 5) {
    return this.articleRepository.find({
      where: {
        status: 'published',
        isRecommended: true,
      },
      relations: ['author', 'category'],
      order: { sortOrder: 'DESC', publishedAt: 'DESC' },
      take: limit,
    });
  }

  async getPopular(limit = 5) {
    return this.articleRepository.find({
      where: { status: 'published' },
      relations: ['author', 'category'],
      order: { viewCount: 'DESC', publishedAt: 'DESC' },
      take: limit,
    });
  }

  async getByCategory(categoryId: string, limit = 10) {
    return this.articleRepository.find({
      where: {
        categoryId,
        status: 'published',
      },
      relations: ['author', 'category'],
      order: { publishedAt: 'DESC' },
      take: limit,
    });
  }

  async getByTag(tag: string, limit = 10) {
    return this.articleRepository.find({
      where: {
        tags: Like(`%${tag}%`),
        status: 'published',
      },
      relations: ['author', 'category'],
      order: { publishedAt: 'DESC' },
      take: limit,
    });
  }

  async getAllTags() {
    const articles = await this.articleRepository.find({
      where: { status: 'published' },
      select: ['tags'],
    });

    const allTags = articles
      .filter(article => article.tags && article.tags.length > 0)
      .flatMap(article => article.tags)
      .filter((tag, index, self) => self.indexOf(tag) === index)
      .sort();

    return allTags;
  }

  async getStats() {
    const total = await this.articleRepository.count();
    const published = await this.articleRepository.count({ where: { status: 'published' } });
    const draft = await this.articleRepository.count({ where: { status: 'draft' } });
    const archived = await this.articleRepository.count({ where: { status: 'archived' } });

    // 最近30天发布的文章
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recent = await this.articleRepository.count({
      where: {
        publishedAt: MoreThan(thirtyDaysAgo),
        status: 'published',
      },
    });

    return {
      total,
      published,
      draft,
      archived,
      recent,
    };
  }

  private async recordAnalytics(request: any, type: string, targetId: string, targetTitle?: string) {
    try {
      const analytics = this.analyticsRepository.create({
        date: new Date().toISOString().split('T')[0],
        type: type as 'page_view' | 'article_view' | 'moment_view' | 'work_view' | 'user_visit' | 'article_like' | 'article_share',
        targetId,
        targetTitle,
        ipAddress: this.getClientIp(request),
        userAgent: request.headers?.['user-agent'],
        referer: request.headers?.referer,
      });

      await this.analyticsRepository.save(analytics);
    } catch (error) {
      console.error('记录分析数据失败:', error);
    }
  }

  private getClientIp(request: any): string {
    return request.headers?.['x-forwarded-for'] ||
           request.headers?.['x-real-ip'] ||
           request.connection?.remoteAddress ||
           request.socket?.remoteAddress ||
           request.ip ||
           '127.0.0.1';
  }
}