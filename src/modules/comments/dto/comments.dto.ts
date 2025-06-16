import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../users/dto/users.dto';

export class CreateCommentDto {
  @ApiProperty({ description: 'Comment content', example: 'This is a great article!' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: 'Entity type', example: 'article', enum: ['article', 'moment', 'work'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['article', 'moment', 'work'])
  entityType: string;

  @ApiProperty({ description: 'Entity ID', example: 1 })
  @IsNumber()
  @Type(() => Number)
  entityId: number;

  @ApiPropertyOptional({ description: 'Parent comment ID for replies', example: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  parentId?: number;
}

export class UpdateCommentDto {
  @ApiPropertyOptional({ description: 'Comment content', example: 'Updated comment content' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  content?: string;

  @ApiPropertyOptional({ description: 'Comment status', example: true })
  @IsOptional()
  @IsBoolean()
  status?: boolean;
}

export class CommentPaginationDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by status', example: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  status?: boolean;

  @ApiPropertyOptional({ description: 'Filter by entity type', example: 'article' })
  @IsOptional()
  @IsString()
  @IsIn(['article', 'moment', 'work'])
  entityType?: string;

  @ApiPropertyOptional({ description: 'Filter by entity ID', example: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  entityId?: number;
}