import {
  Controller,
  Get,
  Param,
  Query,
  Post,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { ArticlesService } from './articles.service';
import { ArticlePaginationDto } from './dto/articles.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('公开文章')
@Controller('public/articles')
@Public()
export class PublicArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  @ApiOperation({ summary: '获取公开文章列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  findAll(@Query() paginationDto: ArticlePaginationDto) {
    return this.articlesService.findAll(paginationDto, true);
  }

  @Get('recommended')
  @ApiOperation({ summary: '获取推荐文章' })
  @ApiResponse({ status: 200, description: '获取成功' })
  getRecommended(@Query('limit') limit?: number) {
    return this.articlesService.getRecommended(limit);
  }

  @Get('popular')
  @ApiOperation({ summary: '获取热门文章' })
  @ApiResponse({ status: 200, description: '获取成功' })
  getPopular(@Query('limit') limit?: number) {
    return this.articlesService.getPopular(limit);
  }

  @Get('tags')
  @ApiOperation({ summary: '获取所有标签' })
  @ApiResponse({ status: 200, description: '获取成功' })
  getAllTags() {
    return this.articlesService.getAllTags();
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: '根据分类获取文章' })
  @ApiResponse({ status: 200, description: '获取成功' })
  getByCategory(
    @Param('categoryId') categoryId: string,
    @Query('limit') limit?: number,
  ) {
    return this.articlesService.getByCategory(categoryId, limit);
  }

  @Get('tag/:tag')
  @ApiOperation({ summary: '根据标签获取文章' })
  @ApiResponse({ status: 200, description: '获取成功' })
  getByTag(
    @Param('tag') tag: string,
    @Query('limit') limit?: number,
  ) {
    return this.articlesService.getByTag(tag, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取文章详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '文章不存在' })
  findOne(@Param('id') id: string) {
    return this.articlesService.findOne(id, true);
  }

  @Post(':id/view')
  @ApiOperation({ summary: '增加文章浏览量' })
  @ApiResponse({ status: 200, description: '操作成功' })
  incrementView(@Param('id') id: string, @Request() req: Express.Request) {
    return this.articlesService.incrementViewCount(id, req);
  }

  @Post(':id/like')
  @ApiOperation({ summary: '点赞文章' })
  @ApiResponse({ status: 200, description: '点赞成功' })
  @ApiResponse({ status: 404, description: '文章不存在' })
  incrementLike(@Param('id') id: string) {
    return this.articlesService.incrementLikeCount(id);
  }
}