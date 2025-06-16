import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Moment } from '../../entities/Moment';
import { User } from '../../entities/User';
import { Analytics } from '../../entities/Analytics';
import { CreateMomentDto, UpdateMomentDto, MomentPaginationDto } from './dto/moments.dto';

@Injectable()
export class MomentsService {
  constructor(
    @InjectRepository(Moment)
    private momentRepository: Repository<Moment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Analytics)
    private analyticsRepository: Repository<Analytics>,
  ) {}

  async findAll(paginationDto: MomentPaginationDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      status,
      userId,
    } = paginationDto;

    const queryBuilder = this.momentRepository
      .createQueryBuilder('moment')
      .leftJoinAndSelect('moment.user', 'user');

    if (search) {
      queryBuilder.andWhere(
        '(moment.content LIKE :search OR moment.tags LIKE :search OR user.username LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status !== undefined) {
      queryBuilder.andWhere('moment.status = :status', { status });
    }

    if (userId) {
      queryBuilder.andWhere('moment.userId = :userId', { userId });
    }

    const validSortFields = ['createdAt', 'updatedAt', 'viewCount', 'likeCount'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`moment.${sortField}`, sortOrder as 'ASC' | 'DESC');

    const [moments, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: moments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findPublic(paginationDto: MomentPaginationDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      userId,
    } = paginationDto;

    const queryBuilder = this.momentRepository
      .createQueryBuilder('moment')
      .leftJoinAndSelect('moment.user', 'user')
      .where('moment.status = :status', { status: true });

    if (search) {
      queryBuilder.andWhere(
        '(moment.content LIKE :search OR moment.tags LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (userId) {
      queryBuilder.andWhere('moment.userId = :userId', { userId });
    }

    const validSortFields = ['createdAt', 'viewCount', 'likeCount'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`moment.${sortField}`, sortOrder as 'ASC' | 'DESC');

    const [moments, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: moments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Moment> {
    const moment = await this.momentRepository.findOne({
      where: { id },
      relations: ['author', 'comments'],
    });

    if (!moment) {
      throw new NotFoundException(`Moment with ID ${id} not found`);
    }

    return moment;
  }

  async findOnePublic(id: string): Promise<Moment> {
    const moment = await this.momentRepository.findOne({
      where: { id, visibility: 'public' },
      relations: ['author', 'comments'],
    });

    if (!moment) {
      throw new NotFoundException(`Moment with ID ${id} not found`);
    }

    return moment;
  }

  async create(createMomentDto: CreateMomentDto, userId: string): Promise<Moment> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const moment = this.momentRepository.create({
      ...createMomentDto,
      authorId: userId,
    });

    return await this.momentRepository.save(moment);
  }

  async update(id: string, updateMomentDto: UpdateMomentDto, userId: string, isAdmin = false): Promise<Moment> {
    const moment = await this.findOne(id);

    // 只有作者或管理员可以编辑
    if (!isAdmin && moment.author.id !== userId) {
      throw new ForbiddenException('You can only edit your own moments');
    }

    Object.assign(moment, updateMomentDto);
    return await this.momentRepository.save(moment);
  }

  async remove(id: string, userId: string, isAdmin = false): Promise<void> {
    const moment = await this.findOne(id);

    // 只有作者或管理员可以删除
    if (!isAdmin && moment.author.id !== userId) {
      throw new ForbiddenException('You can only delete your own moments');
    }

    await this.momentRepository.remove(moment);
  }

  async toggleVisibility(id: string): Promise<Moment> {
    const moment = await this.findOne(id);
    moment.visibility = moment.visibility === 'public' ? 'private' : 'public';
    return await this.momentRepository.save(moment);
  }

  async incrementView(id: string): Promise<void> {
    await this.momentRepository.increment({ id }, 'viewCount', 1);
    
    // 记录分析数据
    const analytics = this.analyticsRepository.create({
      type: 'moment_view',
      targetId: id,
      date: new Date().toISOString().split('T')[0],
    });
    await this.analyticsRepository.save(analytics);
  }

  async incrementLike(id: string): Promise<void> {
    await this.momentRepository.increment({ id }, 'likeCount', 1);
  }

  async getPopular(limit = 10): Promise<Moment[]> {
    return await this.momentRepository.find({
      where: { visibility: 'public' },
      order: { likeCount: 'DESC', viewCount: 'DESC' },
      take: limit,
      relations: ['author'],
    });
  }

  async getRecent(limit = 10): Promise<Moment[]> {
    return await this.momentRepository.find({
      where: { visibility: 'public' },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['author'],
    });
  }

  async getMomentsByLocation(location: string, limit = 10): Promise<Moment[]> {
    return await this.momentRepository.find({
      where: { 
        visibility: 'public',
        location: location 
      },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['author'],
    });
  }

  async getAllLocations(): Promise<string[]> {
    const moments = await this.momentRepository.find({
      where: { visibility: 'public' },
      select: ['location'],
    });

    const locations = moments
      .map(moment => moment.location)
      .filter(location => location)
      .filter((location, index, self) => self.indexOf(location) === index);

    return locations;
  }

  async getStatistics() {
    const total = await this.momentRepository.count();
    const published = await this.momentRepository.count({ where: { visibility: 'public' } });
    const draft = await this.momentRepository.count({ where: { visibility: 'private' } });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await this.momentRepository.count({
      where: {
        createdAt: MoreThan(today),
      },
    });

    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    const weekCount = await this.momentRepository.count({
      where: {
        createdAt: MoreThan(thisWeek),
      },
    });

    const thisMonth = new Date();
    thisMonth.setDate(thisMonth.getDate() - 30);
    const monthCount = await this.momentRepository.count({
      where: {
        createdAt: MoreThan(thisMonth),
      },
    });

    const totalViews = await this.momentRepository
      .createQueryBuilder('moment')
      .select('SUM(moment.viewCount)', 'total')
      .getRawOne();

    const totalLikes = await this.momentRepository
      .createQueryBuilder('moment')
      .select('SUM(moment.likeCount)', 'total')
      .getRawOne();

    return {
      total,
      published,
      draft,
      today: todayCount,
      week: weekCount,
      month: monthCount,
      totalViews: parseInt(totalViews.total) || 0,
      totalLikes: parseInt(totalLikes.total) || 0,
    };
  }
}