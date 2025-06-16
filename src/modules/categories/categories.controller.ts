import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/categories.dto';
import { PaginationDto } from '../users/dto/users.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('分类管理')
@Controller('admin/categories')
@UseGuards(JwtAuthGuard, AdminGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取分类列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.categoriesService.findAll(paginationDto, false);
  }

  @Get('stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取分类统计' })
  @ApiResponse({ status: 200, description: '获取成功' })
  getStats() {
    return this.categoriesService.getStats();
  }

  @Get('with-count')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取分类及文章数量' })
  @ApiResponse({ status: 200, description: '获取成功' })
  getWithArticleCount() {
    return this.categoriesService.getWithArticleCount();
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取分类详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '分类不存在' })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id, false);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建分类' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 409, description: '分类名称已存在' })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新分类' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '分类不存在' })
  @ApiResponse({ status: 409, description: '分类名称已存在' })
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Patch(':id/toggle-status')
  @ApiBearerAuth()
  @ApiOperation({ summary: '切换分类状态' })
  @ApiResponse({ status: 200, description: '切换成功' })
  @ApiResponse({ status: 404, description: '分类不存在' })
  toggleStatus(@Param('id') id: string) {
    return this.categoriesService.toggleStatus(id);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除分类' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '分类不存在' })
  @ApiResponse({ status: 409, description: '该分类下还有文章，无法删除' })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}