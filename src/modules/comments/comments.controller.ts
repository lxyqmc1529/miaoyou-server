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
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('Comments Management')
@Controller('admin/comments')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all comments with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'Comments retrieved successfully' })
  async findAll(@Query() paginationDto: CommentPaginationDto) {
    return await this.commentsService.findAll(paginationDto);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get comment statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStatistics() {
    return await this.commentsService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get comment by ID' })
  @ApiResponse({ status: 200, description: 'Comment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async findOne(@Param('id') id: string) {
    return await this.commentsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new comment' })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(@Body() createCommentDto: CreateCommentDto, @Request() req: Express.Request & { user: { id: string } }) {
    return await this.commentsService.create(createCommentDto, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update comment by ID' })
  @ApiResponse({ status: 200, description: 'Comment updated successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async update(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @Request() req: Express.Request & { user: { id: string; role: string } },
  ) {
    return await this.commentsService.update(id, updateCommentDto, req.user.id, req.user.role === 'admin');
  }

  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Toggle comment status' })
  @ApiResponse({ status: 200, description: 'Comment status toggled successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async toggleStatus(@Param('id') id: string) {
    return await this.commentsService.toggleStatus(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete comment by ID' })
  @ApiResponse({ status: 200, description: 'Comment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async remove(@Param('id') id: string, @Request() req: Express.Request & { user: { id: string; role: string } }) {
    await this.commentsService.remove(id, req.user.id, req.user.role === 'admin'); // Admin can delete any comment
    return { message: 'Comment deleted successfully' };
  }
}