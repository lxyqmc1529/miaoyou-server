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
import { WorksService } from './works.service';
import { CreateWorkDto, UpdateWorkDto, WorkPaginationDto } from './dto/works.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Public Works')
@Controller('works')
@UseGuards(JwtAuthGuard)
export class PublicWorksController {
  constructor(private readonly worksService: WorksService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get published works with pagination' })
  @ApiResponse({ status: 200, description: 'Works retrieved successfully' })
  async findAll(@Query() paginationDto: WorkPaginationDto) {
    return await this.worksService.findPublic(paginationDto);
  }

  @Get('featured')
  @Public()
  @ApiOperation({ summary: 'Get featured works' })
  @ApiResponse({ status: 200, description: 'Featured works retrieved successfully' })
  async getFeatured(@Query('limit') limit?: string) {
    return await this.worksService.getFeatured(limit ? +limit : 10);
  }

  @Get('popular')
  @Public()
  @ApiOperation({ summary: 'Get popular works' })
  @ApiResponse({ status: 200, description: 'Popular works retrieved successfully' })
  async getPopular(@Query('limit') limit?: string) {
    return await this.worksService.getPopular(limit ? +limit : 10);
  }

  @Get('recent')
  @Public()
  @ApiOperation({ summary: 'Get recent works' })
  @ApiResponse({ status: 200, description: 'Recent works retrieved successfully' })
  async getRecent(@Query('limit') limit?: string) {
    return await this.worksService.getRecent(limit ? +limit : 10);
  }

  @Get('categories')
  @Public()
  @ApiOperation({ summary: 'Get all work categories' })
  @ApiResponse({ status: 200, description: 'Work categories retrieved successfully' })
  async getAllCategories() {
    return await this.worksService.getAllCategories();
  }

  @Get('technologies')
  @Public()
  @ApiOperation({ summary: 'Get all technologies' })
  @ApiResponse({ status: 200, description: 'Technologies retrieved successfully' })
  async getAllTechnologies() {
    return await this.worksService.getAllTechnologies();
  }

  @Get('category/:category')
  @Public()
  @ApiOperation({ summary: 'Get works by category' })
  @ApiResponse({ status: 200, description: 'Works retrieved successfully' })
  async getByCategory(
    @Param('category') category: string,
    @Query() paginationDto: WorkPaginationDto,
  ) {
    return await this.worksService.getByCategory(category, paginationDto);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get work by ID' })
  @ApiResponse({ status: 200, description: 'Work retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Work not found' })
  async findOne(@Param('id') id: string) {
    return await this.worksService.findOnePublic(id);
  }

  @Post(':id/view')
  @Public()
  @ApiOperation({ summary: 'Increment work view count' })
  @ApiResponse({ status: 200, description: 'View count incremented successfully' })
  @ApiResponse({ status: 404, description: 'Work not found' })
  async incrementView(@Param('id') id: string) {
    return await this.worksService.incrementView(id);
  }

  @Post(':id/like')
  @Public()
  @ApiOperation({ summary: 'Like a work' })
  @ApiResponse({ status: 200, description: 'Work liked successfully' })
  @ApiResponse({ status: 404, description: 'Work not found' })
  async likeWork(@Param('id') id: string) {
    return await this.worksService.incrementLike(id);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new work' })
  @ApiResponse({ status: 201, description: 'Work created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Work with this title already exists' })
  async create(@Body() createWorkDto: CreateWorkDto, @Request() req: Express.Request & { user: { id: string } }) {
    return await this.worksService.create(createWorkDto, req.user.id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update your own work' })
  @ApiResponse({ status: 200, description: 'Work updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only edit your own works' })
  @ApiResponse({ status: 404, description: 'Work not found' })
  @ApiResponse({ status: 409, description: 'Work with this title already exists' })
  async update(
    @Param('id') id: string,
    @Body() updateWorkDto: UpdateWorkDto,
    @Request() req: Express.Request & { user: { id: string } },
  ) {
    return await this.worksService.update(id, updateWorkDto, req.user.id, false);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete your own work' })
  @ApiResponse({ status: 200, description: 'Work deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only delete your own works' })
  @ApiResponse({ status: 404, description: 'Work not found' })
  async remove(@Param('id') id: string, @Request() req: Express.Request & { user: { id: string } }) {
    await this.worksService.remove(id, req.user.id, false);
    return { message: 'Work deleted successfully' };
  }
}