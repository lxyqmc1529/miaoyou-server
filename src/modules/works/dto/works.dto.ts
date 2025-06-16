import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsArray, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../users/dto/users.dto';

export class CreateWorkDto {
  @ApiProperty({ description: 'Work title', example: 'Personal Portfolio Website' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Work description', example: 'A responsive portfolio website built with React and TypeScript' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Work type', example: 'website' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiPropertyOptional({ description: 'Technologies used (comma-separated)', example: 'React,TypeScript,Tailwind CSS' })
  @IsOptional()
  @IsString()
  technologies?: string;

  @ApiPropertyOptional({ description: 'Work images', example: ['screenshot1.jpg', 'screenshot2.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: 'Demo URL', example: 'https://example.com' })
  @IsOptional()
  @IsUrl()
  demoUrl?: string;

  @ApiPropertyOptional({ description: 'Source code URL', example: 'https://github.com/user/repo' })
  @IsOptional()
  @IsUrl()
  sourceUrl?: string;

  @ApiPropertyOptional({ description: 'Work status', example: true, default: true })
  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @ApiPropertyOptional({ description: 'Featured work', example: false, default: false })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;
}

export class UpdateWorkDto {
  @ApiPropertyOptional({ description: 'Work title', example: 'Updated Portfolio Website' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @ApiPropertyOptional({ description: 'Work description', example: 'Updated description' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @ApiPropertyOptional({ description: 'Work type', example: 'web-app' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  type?: string;

  @ApiPropertyOptional({ description: 'Technologies used (comma-separated)', example: 'React,TypeScript,Next.js' })
  @IsOptional()
  @IsString()
  technologies?: string;

  @ApiPropertyOptional({ description: 'Work images', example: ['screenshot1.jpg', 'screenshot2.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: 'Demo URL', example: 'https://example.com' })
  @IsOptional()
  @IsUrl()
  demoUrl?: string;

  @ApiPropertyOptional({ description: 'Source code URL', example: 'https://github.com/user/repo' })
  @IsOptional()
  @IsUrl()
  sourceUrl?: string;

  @ApiPropertyOptional({ description: 'Work status', example: true })
  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @ApiPropertyOptional({ description: 'Featured work', example: true })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;
}

export class WorkPaginationDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by status', example: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  status?: boolean;

  @ApiPropertyOptional({ description: 'Filter by work type', example: 'website' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Filter by featured status', example: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  featured?: boolean;

  @ApiPropertyOptional({ description: 'Filter by user ID', example: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  userId?: number;
}