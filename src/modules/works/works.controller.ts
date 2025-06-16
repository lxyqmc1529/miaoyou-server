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
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('Works Management')
@Controller('admin/works')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class WorksController {
  constructor(private readonly worksService: WorksService) {}

  @Get()
  @ApiOperation({ summary: 'Get all works with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'Works retrieved successfully' })
  async findAll(@Query() paginationDto: WorkPaginationDto) {
    return await this.worksService.findAll(paginationDto);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get work statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStatistics() {
    return await this.worksService.getStatistics();
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all work categories' })
  @ApiResponse({ status: 200, description: 'Work categories retrieved successfully' })
  async getAllCategories() {
    return await this.worksService.getAllCategories();
  }

  @Get('technologies')
  @ApiOperation({ summary: 'Get all technologies' })
  @ApiResponse({ status: 200, description: 'Technologies retrieved successfully' })
  async getAllTechnologies() {
    return await this.worksService.getAllTechnologies();
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured works' })
  @ApiResponse({ status: 200, description: 'Featured works retrieved successfully' })
  async getFeatured(@Query('limit') limit?: string) {
    return await this.worksService.getFeatured(limit ? +limit : 10);
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular works' })
  @ApiResponse({ status: 200, description: 'Popular works retrieved successfully' })
  async getPopular(@Query('limit') limit?: string) {
    return await this.worksService.getPopular(limit ? +limit : 10);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get work by ID' })
  @ApiResponse({ status: 200, description: 'Work retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Work not found' })
  async findOne(@Param('id') id: string) {
    return await this.worksService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new work' })
  @ApiResponse({ status: 201, description: 'Work created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Work with this title already exists' })
  async create(@Body() createWorkDto: CreateWorkDto, @Request() req: Express.Request & { user: { id: string } }) {
    return await this.worksService.create(createWorkDto, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update work by ID' })
  @ApiResponse({ status: 200, description: 'Work updated successfully' })
  @ApiResponse({ status: 404, description: 'Work not found' })
  @ApiResponse({ status: 409, description: 'Work with this title already exists' })
  async update(
    @Param('id') id: string,
    @Body() updateWorkDto: UpdateWorkDto,
    @Request() req: Express.Request & { user: { id: string; role: string } },
  ) {
    return await this.worksService.update(id, updateWorkDto, req.user.id, req.user.role === 'admin');
  }

  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Toggle work status' })
  @ApiResponse({ status: 200, description: 'Work status toggled successfully' })
  @ApiResponse({ status: 404, description: 'Work not found' })
  async toggleStatus(@Param('id') id: string) {
    return await this.worksService.toggleStatus(id);
  }

  @Patch(':id/toggle-featured')
  @ApiOperation({ summary: 'Toggle work featured status' })
  @ApiResponse({ status: 200, description: 'Work featured status toggled successfully' })
  @ApiResponse({ status: 404, description: 'Work not found' })
  async toggleFeatured(@Param('id') id: string) {
    return await this.worksService.toggleFeatured(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete work by ID' })
  @ApiResponse({ status: 200, description: 'Work deleted successfully' })
  @ApiResponse({ status: 404, description: 'Work not found' })
  async remove(@Param('id') id: string, @Request() req: Express.Request & { user: { id: string; role: string } }) {
    await this.worksService.remove(id, req.user.id, req.user.role === 'admin');
    return { message: 'Work deleted successfully' };
  }
}