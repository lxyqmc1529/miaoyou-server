import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { CategoriesService } from './categories.service';
import { PaginationDto } from '../users/dto/users.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('公开分类')
@Controller('public/categories')
@Public()
export class PublicCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: '获取公开分类列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(@Query() paginationDto?: PaginationDto) {
    const result = await this.categoriesService.findAll(paginationDto, true);
    return {
      success: true,
      data: result,
      message: '获取成功'
    };
  }

  @Get('with-count')
  @ApiOperation({ summary: '获取分类及文章数量' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getWithArticleCount() {
    const result = await this.categoriesService.getWithArticleCount();
    return {
      success: true,
      data: result,
      message: '获取成功'
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取分类详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '分类不存在' })
  async findOne(@Param('id') id: string) {
    const result = await this.categoriesService.findOne(id, true);
    return {
      success: true,
      data: result,
      message: '获取成功'
    };
  }
}