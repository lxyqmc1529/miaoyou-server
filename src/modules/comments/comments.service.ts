import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Comment } from '../../entities/Comment';
import { Article } from '../../entities/Article';
import { Moment } from '../../entities/Moment';
import { Work } from '../../entities/Work';
import { User } from '../../entities/User';
import { CreateCommentDto, UpdateCommentDto, CommentPaginationDto } from './dto/comments.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
    @InjectRepository(Moment)
    private momentRepository: Repository<Moment>,
    @InjectRepository(Work)
    private workRepository: Repository<Work>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(paginationDto: CommentPaginationDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      status,
      entityType,
      entityId,
    } = paginationDto;

    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.parent', 'parent')
      .leftJoinAndSelect('parent.user', 'parentUser');

    if (search) {
      queryBuilder.andWhere(
        '(comment.content LIKE :search OR user.username LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status !== undefined) {
      queryBuilder.andWhere('comment.status = :status', { status });
    }

    if (entityType) {
      queryBuilder.andWhere('comment.entityType = :entityType', { entityType });
    }

    if (entityId) {
      queryBuilder.andWhere('comment.entityId = :entityId', { entityId });
    }

    const validSortFields = ['createdAt', 'updatedAt', 'likeCount'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`comment.${sortField}`, sortOrder as 'ASC' | 'DESC');

    const [comments, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: comments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByEntity(entityType: string, entityId: number, paginationDto: CommentPaginationDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = paginationDto;

    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.parent', 'parent')
      .leftJoinAndSelect('parent.user', 'parentUser')
      .where('comment.entityType = :entityType', { entityType })
      .andWhere('comment.entityId = :entityId', { entityId })
      .andWhere('comment.status = :status', { status: true });

    const validSortFields = ['createdAt', 'likeCount'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`comment.${sortField}`, sortOrder as 'ASC' | 'DESC');

    const [comments, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: comments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['author', 'parent', 'replies'],
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    return comment;
  }

  async create(createCommentDto: CreateCommentDto, userId?: string): Promise<Comment> {
    const { entityType, entityId, parentId, content } = createCommentDto;

    // 验证实体是否存在
    await this.validateEntity(entityType, entityId);

    // 验证父评论是否存在
    if (parentId) {
      const parentComment = await this.commentRepository.findOne({
        where: { id: String(parentId) },
      });
      if (!parentComment) {
        throw new NotFoundException(`Parent comment with ID ${parentId} not found`);
      }
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const comment = this.commentRepository.create({
      content,
      parentId: parentId ? String(parentId) : null,
      authorId: userId,
      status: 'approved',
      [`${entityType}Id`]: entityId,
    });

    return await this.commentRepository.save(comment);
  }

  async update(id: string, updateCommentDto: UpdateCommentDto, userId: string, isAdmin = false): Promise<Comment> {
    const comment = await this.findOne(String(id));

    // 只有评论作者可以编辑评论
    if (comment.author.id !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    Object.assign(comment, updateCommentDto);
    return await this.commentRepository.save(comment);
  }

  async remove(id: string, userId: string, isAdmin = false): Promise<void> {
    const comment = await this.findOne(String(id));

    // 只有评论作者或管理员可以删除评论
    if (!isAdmin && comment.author.id !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.commentRepository.remove(comment);
  }

  async toggleStatus(id: string): Promise<Comment> {
    const comment = await this.findOne(String(id));
    comment.status = comment.status === 'approved' ? 'pending' : 'approved';
    return await this.commentRepository.save(comment);
  }

  async incrementLike(id: number): Promise<Comment> {
    const comment = await this.findOne(String(id));
    comment.likeCount += 1;
    return await this.commentRepository.save(comment);
  }

  async getStatistics() {
    const total = await this.commentRepository.count();
    const active = await this.commentRepository.count({ where: { status: 'approved' } });
    const inactive = await this.commentRepository.count({ where: { status: 'pending' } });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await this.commentRepository.count({
      where: {
        createdAt: MoreThan(today),
      },
    });

    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    const weekCount = await this.commentRepository.count({
      where: {
        createdAt: MoreThan(thisWeek),
      },
    });

    const thisMonth = new Date();
    thisMonth.setDate(thisMonth.getDate() - 30);
    const monthCount = await this.commentRepository.count({
      where: {
        createdAt: MoreThan(thisMonth),
      },
    });

    return {
      total,
      active,
      inactive,
      today: todayCount,
      week: weekCount,
      month: monthCount,
    };
  }

  private async validateEntity(entityType: string, entityId: number): Promise<void> {
    let entity;
    switch (entityType) {
      case 'article':
        entity = await this.articleRepository.findOne({ where: { id: String(entityId) } });
        break;
      case 'moment':
        entity = await this.momentRepository.findOne({ where: { id: String(entityId) } });
        break;
      case 'work':
        entity = await this.workRepository.findOne({ where: { id: String(entityId) } });
        break;
      default:
        throw new NotFoundException(`Invalid entity type: ${entityType}`);
    }

    if (!entity) {
      throw new NotFoundException(`${entityType} with ID ${entityId} not found`);
    }
  }
}