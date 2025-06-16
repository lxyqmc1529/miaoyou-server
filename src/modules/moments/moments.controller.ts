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
import { MomentsService } from './moments.service';
import { CreateMomentDto, UpdateMomentDto, MomentPaginationDto } from './dto/moments.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('Moments Management')
@Controller('admin/moments')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class MomentsController {
  constructor(private readonly momentsService: MomentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all moments with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'Moments retrieved successfully' })
  async findAll(@Query() paginationDto: MomentPaginationDto) {
    return await this.momentsService.findAll(paginationDto);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get moment statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStatistics() {
    return await this.momentsService.getStatistics();
  }

  @Get('locations')
  @ApiOperation({ summary: 'Get all locations' })
  @ApiResponse({ status: 200, description: 'Locations retrieved successfully' })
  async getAllLocations() {
    return await this.momentsService.getAllLocations();
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular moments' })
  @ApiResponse({ status: 200, description: 'Popular moments retrieved successfully' })
  async getPopular(@Query('limit') limit?: string) {
    return await this.momentsService.getPopular(limit ? +limit : 10);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get moment by ID' })
  @ApiResponse({ status: 200, description: 'Moment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Moment not found' })
  async findOne(@Param('id') id: string) {
    return await this.momentsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new moment' })
  @ApiResponse({ status: 201, description: 'Moment created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(@Body() createMomentDto: CreateMomentDto, @Request() req: Express.Request & { user: { id: string } }) {
    return await this.momentsService.create(createMomentDto, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update moment by ID' })
  @ApiResponse({ status: 200, description: 'Moment updated successfully' })
  @ApiResponse({ status: 404, description: 'Moment not found' })
  async update(
    @Param('id') id: string,
    @Body() updateMomentDto: UpdateMomentDto,
    @Request() req: Express.Request & { user: { id: string; role: string } },
  ) {
    return await this.momentsService.update(id, updateMomentDto, req.user.id, req.user.role === 'admin');
  }

  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Toggle moment status' })
  @ApiResponse({ status: 200, description: 'Moment status toggled successfully' })
  @ApiResponse({ status: 404, description: 'Moment not found' })
  async toggleVisibility(@Param('id') id: string) {
    return await this.momentsService.toggleVisibility(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete moment by ID' })
  @ApiResponse({ status: 200, description: 'Moment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Moment not found' })
  async remove(@Param('id') id: string, @Request() req: Express.Request & { user: { id: string; role: string } }) {
    await this.momentsService.remove(id, req.user.id, req.user.role === 'admin');
    return { message: 'Moment deleted successfully' };
  }
}