import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ description: '分类名称' })
  @IsString()
  @MaxLength(100, { message: '分类名称最多100字符' })
  name: string;

  @ApiProperty({ description: '分类描述', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: '分类描述最多255字符' })
  description?: string;

  @ApiProperty({ description: '分类封面', required: false })
  @IsOptional()
  @IsString()
  cover?: string;

  @ApiProperty({ description: '排序权重', default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiProperty({ description: '是否激活', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCategoryDto {
  @ApiProperty({ description: '分类名称', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: '分类名称最多100字符' })
  name?: string;

  @ApiProperty({ description: '分类描述', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: '分类描述最多255字符' })
  description?: string;

  @ApiProperty({ description: '分类封面', required: false })
  @IsOptional()
  @IsString()
  cover?: string;

  @ApiProperty({ description: '排序权重', required: false })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiProperty({ description: '是否激活', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}