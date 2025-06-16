import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  IsUUID,
  MaxLength,
  IsInt,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { PaginationDto } from '../../users/dto/users.dto';

export class CreateArticleDto {
  @ApiProperty({ description: '文章标题' })
  @IsString()
  @MaxLength(200, { message: '标题最多200字符' })
  title: string;

  @ApiProperty({ description: '文章摘要', required: false })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiProperty({ description: '文章内容' })
  @IsString()
  content: string;

  @ApiProperty({ description: '封面图片', required: false })
  @IsOptional()
  @IsString()
  cover?: string;

  @ApiProperty({ description: '标签数组', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ description: '文章状态', enum: ['draft', 'published', 'archived'], default: 'draft' })
  @IsOptional()
  @IsEnum(['draft', 'published', 'archived'], { message: '状态只能是draft、published或archived' })
  status?: 'draft' | 'published' | 'archived';

  @ApiProperty({ description: '是否推荐', default: false })
  @IsOptional()
  @IsBoolean()
  isRecommended?: boolean;

  @ApiProperty({ description: '是否置顶', default: false })
  @IsOptional()
  @IsBoolean()
  isTop?: boolean;

  @ApiProperty({ description: '排序权重', default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiProperty({ description: '分类ID', required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}

export class UpdateArticleDto {
  @ApiProperty({ description: '文章标题', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: '标题最多200字符' })
  title?: string;

  @ApiProperty({ description: '文章摘要', required: false })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiProperty({ description: '文章内容', required: false })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ description: '封面图片', required: false })
  @IsOptional()
  @IsString()
  cover?: string;

  @ApiProperty({ description: '标签数组', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ description: '文章状态', enum: ['draft', 'published', 'archived'], required: false })
  @IsOptional()
  @IsEnum(['draft', 'published', 'archived'], { message: '状态只能是draft、published或archived' })
  status?: 'draft' | 'published' | 'archived';

  @ApiProperty({ description: '是否推荐', required: false })
  @IsOptional()
  @IsBoolean()
  isRecommended?: boolean;

  @ApiProperty({ description: '是否置顶', required: false })
  @IsOptional()
  @IsBoolean()
  isTop?: boolean;

  @ApiProperty({ description: '排序权重', required: false })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiProperty({ description: '分类ID', required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ description: '发布时间', required: false })
  @IsOptional()
  publishedAt?: Date;
}

export class ArticlePaginationDto extends PaginationDto {
  @ApiProperty({ description: '分类ID', required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ description: '标签', required: false })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiProperty({ description: '文章状态', enum: ['draft', 'published', 'archived'], required: false })
  @IsOptional()
  @IsEnum(['draft', 'published', 'archived'])
  status?: 'draft' | 'published' | 'archived';

  @ApiProperty({ description: '作者ID', required: false })
  @IsOptional()
  @IsUUID()
  authorId?: string;
}