import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Category } from '../../entities/Category';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/categories.dto';
import { PaginationDto } from '../users/dto/users.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async findAll(paginationDto?: PaginationDto, isPublic = false) {
    if (!paginationDto) {
      // 不分页，返回所有分类
      const queryBuilder = this.categoryRepository.createQueryBuilder('category');
      
      if (isPublic) {
        queryBuilder.where('category.isActive = :isActive', { isActive: true });
      }
      
      queryBuilder.orderBy('category.sortOrder', 'DESC')
                  .addOrderBy('category.createdAt', 'DESC');
      
      return queryBuilder.getMany();
    }

    const { page, limit, search, sortBy, sortOrder } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.categoryRepository.createQueryBuilder('category');

    // 公开接口只显示激活的分类
    if (isPublic) {
      queryBuilder.where('category.isActive = :isActive', { isActive: true });
    }

    // 搜索功能
    if (search) {
      queryBuilder.andWhere(
        'category.name LIKE :search OR category.description LIKE :search',
        { search: `%${search}%` }
      );
    }

    // 排序
    queryBuilder.orderBy(`category.${sortBy}`, sortOrder);

    // 分页
    queryBuilder.skip(skip).take(limit);

    const [categories, total] = await queryBuilder.getManyAndCount();

    return {
      data: categories,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, isPublic = false) {
    const queryBuilder = this.categoryRepository.createQueryBuilder('category')
      .where('category.id = :id', { id });

    // 公开接口只显示激活的分类
    if (isPublic) {
      queryBuilder.andWhere('category.isActive = :isActive', { isActive: true });
    }

    const category = await queryBuilder.getOne();
    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    return category;
  }

  async create(createCategoryDto: CreateCategoryDto) {
    // 检查分类名称是否已存在
    const existingCategory = await this.categoryRepository.findOne({
      where: { name: createCategoryDto.name },
    });

    if (existingCategory) {
      throw new ConflictException('分类名称已存在');
    }

    const category = this.categoryRepository.create(createCategoryDto);
    return this.categoryRepository.save(category);
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    // 如果更新名称，检查是否已存在
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingCategory = await this.categoryRepository.findOne({
        where: { name: updateCategoryDto.name },
      });

      if (existingCategory) {
        throw new ConflictException('分类名称已存在');
      }
    }

    await this.categoryRepository.update(id, updateCategoryDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['articles'],
    });

    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    // 检查是否有关联的文章
    if (category.articles && category.articles.length > 0) {
      throw new ConflictException('该分类下还有文章，无法删除');
    }

    await this.categoryRepository.remove(category);
    return { message: '分类删除成功' };
  }

  async toggleStatus(id: string) {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    category.isActive = !category.isActive;
    return this.categoryRepository.save(category);
  }

  async getStats() {
    const total = await this.categoryRepository.count();
    const active = await this.categoryRepository.count({ where: { isActive: true } });

    return {
      total,
      active,
      inactive: total - active,
    };
  }

  async getWithArticleCount() {
    return this.categoryRepository
      .createQueryBuilder('category')
      .leftJoin('category.articles', 'article')
      .addSelect('COUNT(article.id)', 'articleCount')
      .where('category.isActive = :isActive', { isActive: true })
      .groupBy('category.id')
      .orderBy('category.sortOrder', 'DESC')
      .getRawAndEntities();
  }
}