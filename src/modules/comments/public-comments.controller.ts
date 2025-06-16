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
import { CommentsService } from './comments.service';
import { CreateCommentDto, UpdateCommentDto, CommentPaginationDto } from './dto/comments.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Public Comments')
@Controller('comments')
@UseGuards(JwtAuthGuard)
export class PublicCommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get(':entityType/:entityId')
  @Public()
  @ApiOperation({ summary: 'Get comments for a specific entity' })
  @ApiResponse({ status: 200, description: 'Comments retrieved successfully' })
  async findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Query() paginationDto: CommentPaginationDto,
  ) {
    return await this.commentsService.findByEntity(
      entityType,
      +entityId,
      paginationDto,
    );
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get comment by ID' })
  @ApiResponse({ status: 200, description: 'Comment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async findOne(@Param('id') id: string) {
    return await this.commentsService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new comment' })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createCommentDto: CreateCommentDto, @Request() req: Express.Request & { user: { id: string } }) {
    return await this.commentsService.create(createCommentDto, req.user.id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update your own comment' })
  @ApiResponse({ status: 200, description: 'Comment updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only edit your own comments' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async update(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @Request() req: Express.Request & { user: { id: string } },
  ) {
    return await this.commentsService.update(id, updateCommentDto, req.user.id);
  }

  @Post(':id/like')
  @Public()
  @ApiOperation({ summary: 'Like a comment' })
  @ApiResponse({ status: 200, description: 'Comment liked successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async likeComment(@Param('id') id: string) {
    return await this.commentsService.incrementLike(+id);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete your own comment' })
  @ApiResponse({ status: 200, description: 'Comment deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only delete your own comments' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async remove(@Param('id') id: string, @Request() req: Express.Request & { user: { id: string } }) {
    await this.commentsService.remove(id, req.user.id, false); // User can only delete own comments
    return { message: 'Comment deleted successfully' };
  }
}