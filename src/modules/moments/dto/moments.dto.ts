import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../users/dto/users.dto';

export class CreateMomentDto {
  @ApiProperty({ description: 'Moment content', example: 'Just finished a great book!' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: 'Moment images', example: ['image1.jpg', 'image2.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: 'Moment tags (comma-separated)', example: 'reading,books,fiction' })
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiPropertyOptional({ description: 'Location', example: 'Beijing, China' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Moment status', example: true, default: true })
  @IsOptional()
  @IsBoolean()
  status?: boolean;
}

export class UpdateMomentDto {
  @ApiPropertyOptional({ description: 'Moment content', example: 'Updated moment content' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  content?: string;

  @ApiPropertyOptional({ description: 'Moment images', example: ['image1.jpg', 'image2.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: 'Moment tags (comma-separated)', example: 'reading,books,fiction' })
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiPropertyOptional({ description: 'Location', example: 'Beijing, China' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Moment status', example: true })
  @IsOptional()
  @IsBoolean()
  status?: boolean;
}

export class MomentPaginationDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by status', example: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  status?: boolean;

  @ApiPropertyOptional({ description: 'Filter by user ID', example: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  userId?: number;
}