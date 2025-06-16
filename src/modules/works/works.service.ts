import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Work } from '../../entities/Work';
import { User } from '../../entities/User';
import { Analytics } from '../../entities/Analytics';
import { CreateWorkDto, UpdateWorkDto, WorkPaginationDto } from './dto/works.dto';

@Injectable()
export class WorksService {
  constructor(
    @InjectRepository(Work)
    private workRepository: Repository<Work>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Analytics)
    private analyticsRepository: Repository<Analytics>,
  ) {}

  async findAll(paginationDto: WorkPaginationDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      status,
      type,
      featured,
      userId,
    } = paginationDto;

    const queryBuilder = this.workRepository
      .createQueryBuilder('work')
      .leftJoinAndSelect('work.user', 'user');

    if (search) {
      queryBuilder.andWhere(
        '(work.title LIKE :search OR work.description LIKE :search OR work.technologies LIKE :search OR user.username LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status !== undefined) {
      queryBuilder.andWhere('work.status = :status', { status });
    }

    if (type) {
      queryBuilder.andWhere('work.type = :type', { type });
    }

    if (featured !== undefined) {
      queryBuilder.andWhere('work.featured = :featured', { featured });
    }

    if (userId) {
      queryBuilder.andWhere('work.userId = :userId', { userId });
    }

    const validSortFields = ['createdAt', 'updatedAt', 'viewCount', 'likeCount', 'title'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`work.${sortField}`, sortOrder as 'ASC' | 'DESC');

    const [works, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: works,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findPublic(paginationDto: WorkPaginationDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      type,
      featured,
      userId,
    } = paginationDto;

    const queryBuilder = this.workRepository
      .createQueryBuilder('work')
      .leftJoinAndSelect('work.user', 'user')
      .where('work.status = :status', { status: true });

    if (search) {
      queryBuilder.andWhere(
        '(work.title LIKE :search OR work.description LIKE :search OR work.technologies LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (type) {
      queryBuilder.andWhere('work.type = :type', { type });
    }

    if (featured !== undefined) {
      queryBuilder.andWhere('work.featured = :featured', { featured });
    }

    if (userId) {
      queryBuilder.andWhere('work.userId = :userId', { userId });
    }

    const validSortFields = ['createdAt', 'viewCount', 'likeCount', 'title'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`work.${sortField}`, sortOrder as 'ASC' | 'DESC');

    const [works, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: works,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Work> {
    const work = await this.workRepository.findOne({
      where: { id },
      relations: ['author', 'comments'],
    });

    if (!work) {
      throw new NotFoundException(`Work with ID ${id} not found`);
    }

    return work;
  }

  async findOnePublic(id: string): Promise<Work> {
    const work = await this.workRepository.findOne({
      where: { id, status: 'published' },
      relations: ['author', 'comments'],
    });

    if (!work) {
      throw new NotFoundException(`Work with ID ${id} not found`);
    }

    return work;
  }

  async create(createWorkDto: CreateWorkDto, userId: string): Promise<Work> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // 检查标题是否已存在
    const existingWork = await this.workRepository.findOne({
      where: { title: createWorkDto.title },
    });
    if (existingWork) {
      throw new ConflictException('Work with this title already exists');
    }

    const work = this.workRepository.create({
      title: createWorkDto.title,
      description: createWorkDto.description,
      category: createWorkDto.type as 'web' | 'mobile' | 'desktop' | 'design' | 'other',
      technologies: createWorkDto.technologies ? createWorkDto.technologies.split(',').map(t => t.trim()) : [],
      images: createWorkDto.images || [],
      demoUrl: createWorkDto.demoUrl,
      sourceUrl: createWorkDto.sourceUrl,
      status: createWorkDto.status ? 'published' : 'draft',
      isFeatured: createWorkDto.featured || false,
      authorId: userId,
      publishedAt: createWorkDto.status ? new Date() : null,
    });

    return await this.workRepository.save(work);
  }

  async update(id: string, updateWorkDto: UpdateWorkDto, userId: string, isAdmin = false): Promise<Work> {
    const work = await this.findOne(id);

    // 只有作者或管理员可以编辑
    if (!isAdmin && work.author.id !== userId) {
      throw new ForbiddenException('You can only edit your own works');
    }

    // 如果更新标题，检查是否与其他作品冲突
    if (updateWorkDto.title && updateWorkDto.title !== work.title) {
      const existingWork = await this.workRepository.findOne({
        where: { title: updateWorkDto.title },
      });
      if (existingWork) {
        throw new ConflictException('Work with this title already exists');
      }
    }

    Object.assign(work, updateWorkDto);
    return await this.workRepository.save(work);
  }

  async remove(id: string, userId: string, isAdmin = false): Promise<void> {
    const work = await this.findOne(id);

    // 只有作者或管理员可以删除
    if (!isAdmin && work.author.id !== userId) {
      throw new ForbiddenException('You can only delete your own works');
    }

    await this.workRepository.remove(work);
  }

  async toggleStatus(id: string): Promise<Work> {
    const work = await this.findOne(id);
    work.status = work.status === 'published' ? 'draft' : 'published';
    if (work.status === 'published') {
      work.publishedAt = new Date();
    }
    return await this.workRepository.save(work);
  }

  async toggleFeatured(id: string): Promise<Work> {
    const work = await this.findOne(id);
    work.isFeatured = !work.isFeatured;
    return await this.workRepository.save(work);
  }

  async incrementView(id: string): Promise<void> {
    await this.workRepository.increment({ id }, 'viewCount', 1);
    
    // 记录分析数据
    const analytics = this.analyticsRepository.create({
      type: 'work_view',
      targetId: id,
      date: new Date().toISOString().split('T')[0],
    });
    await this.analyticsRepository.save(analytics);
  }

  async incrementLike(id: string): Promise<void> {
    await this.workRepository.increment({ id }, 'likeCount', 1);
  }

  async getFeatured(limit: number = 10): Promise<Work[]> {
    return await this.workRepository.find({
      where: { status: 'published', isFeatured: true },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['author'],
    });
  }

  async getPopular(limit: number = 10): Promise<Work[]> {
    return await this.workRepository.find({
      where: { status: 'published' },
      order: { likeCount: 'DESC', viewCount: 'DESC' },
      take: limit,
      relations: ['author'],
    });
  }

  async getRecent(limit: number = 10): Promise<Work[]> {
    return await this.workRepository.find({
      where: { status: 'published' },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['author'],
    });
  }

  async getByCategory(category: string, paginationDto: WorkPaginationDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = paginationDto;

    const queryBuilder = this.workRepository
      .createQueryBuilder('work')
      .leftJoinAndSelect('work.user', 'user')
      .where('work.status = :status', { status: 'published' })
      .andWhere('work.category = :category', { category });

    const validSortFields = ['createdAt', 'viewCount', 'likeCount', 'title'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`work.${sortField}`, sortOrder as 'ASC' | 'DESC');

    const [works, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: works,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAllCategories(): Promise<string[]> {
    const works = await this.workRepository.find({
      where: { status: 'published' },
      select: ['category'],
    });

    const categories = works
      .map(work => work.category)
      .filter(category => category)
      .filter((category, index, self) => self.indexOf(category) === index);

    return categories;
  }

  async getAllTechnologies(): Promise<string[]> {
    const works = await this.workRepository.find({
      where: { status: 'published' },
      select: ['technologies'],
    });

    const allTechnologies = new Set<string>();
    works.forEach(work => {
      if (work.technologies) {
        work.technologies.forEach(tech => allTechnologies.add(tech));
      }
    });

    return Array.from(allTechnologies);
  }

  async getStatistics() {
    const total = await this.workRepository.count();
    const published = await this.workRepository.count({ where: { status: 'published' } });
    const draft = await this.workRepository.count({ where: { status: 'draft' } });
    const featured = await this.workRepository.count({ where: { isFeatured: true } });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await this.workRepository.count({
      where: {
        createdAt: MoreThan(today),
      },
    });

    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    const weekCount = await this.workRepository.count({
      where: {
        createdAt: MoreThan(thisWeek),
      },
    });

    const thisMonth = new Date();
    thisMonth.setDate(thisMonth.getDate() - 30);
    const monthCount = await this.workRepository.count({
      where: {
        createdAt: MoreThan(thisMonth),
      },
    });

    const totalViews = await this.workRepository
      .createQueryBuilder('work')
      .select('SUM(work.viewCount)', 'total')
      .getRawOne();

    const totalLikes = await this.workRepository
      .createQueryBuilder('work')
      .select('SUM(work.likeCount)', 'total')
      .getRawOne();

    return {
      total,
      published,
      draft,
      featured,
      today: todayCount,
      week: weekCount,
      month: monthCount,
      totalViews: parseInt(totalViews.total) || 0,
      totalLikes: parseInt(totalLikes.total) || 0,
    };
  }
}