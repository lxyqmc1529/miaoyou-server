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
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { ArticlesService } from './articles.service';
import { CreateArticleDto, UpdateArticleDto, ArticlePaginationDto } from './dto/articles.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('文章管理')
@Controller('admin/articles')
@UseGuards(JwtAuthGuard)
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取文章列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  findAll(@Query() paginationDto: ArticlePaginationDto) {
    return this.articlesService.findAll(paginationDto, false);
  }

  @Get('stats')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取文章统计' })
  @ApiResponse({ status: 200, description: '获取成功' })
  getStats() {
    return this.articlesService.getStats();
  }

  @Get('tags')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取所有标签' })
  @ApiResponse({ status: 200, description: '获取成功' })
  getAllTags() {
    return this.articlesService.getAllTags();
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取文章详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '文章不存在' })
  findOne(@Param('id') id: string) {
    return this.articlesService.findOne(id, false);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建文章' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 404, description: '分类不存在' })
  create(@Body() createArticleDto: CreateArticleDto, @Request() req: Express.Request & { user: { userId: string; role: string } }) {
    return this.articlesService.create(createArticleDto, req.user.userId);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新文章' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '文章不存在' })
  @ApiResponse({ status: 403, description: '无权限编辑' })
  update(
    @Param('id') id: string,
    @Body() updateArticleDto: UpdateArticleDto,
    @Request() req: Express.Request & { user: { userId: string; role: string } },
  ) {
    return this.articlesService.update(id, updateArticleDto, req.user.userId, req.user.role);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除文章' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '文章不存在' })
  @ApiResponse({ status: 403, description: '无权限删除' })
  remove(@Param('id') id: string, @Request() req: Express.Request & { user: { userId: string; role: string } }) {
    return this.articlesService.remove(id, req.user.userId, req.user.role);
  }
}