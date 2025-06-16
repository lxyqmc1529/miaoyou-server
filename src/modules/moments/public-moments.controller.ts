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
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Public Moments')
@Controller('moments')
@UseGuards(JwtAuthGuard)
export class PublicMomentsController {
  constructor(private readonly momentsService: MomentsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get published moments with pagination' })
  @ApiResponse({ status: 200, description: 'Moments retrieved successfully' })
  async findAll(@Query() paginationDto: MomentPaginationDto) {
    return await this.momentsService.findPublic(paginationDto);
  }

  @Get('popular')
  @Public()
  @ApiOperation({ summary: 'Get popular moments' })
  @ApiResponse({ status: 200, description: 'Popular moments retrieved successfully' })
  async getPopular(@Query('limit') limit?: string) {
    return await this.momentsService.getPopular(limit ? +limit : 10);
  }

  @Get('recent')
  @Public()
  @ApiOperation({ summary: 'Get recent moments' })
  @ApiResponse({ status: 200, description: 'Recent moments retrieved successfully' })
  async getRecent(@Query('limit') limit?: string) {
    return await this.momentsService.getRecent(limit ? +limit : 10);
  }

  @Get('locations/:location')
  @ApiOperation({ summary: 'Get moments by location' })
  @ApiResponse({ status: 200, description: 'Moments retrieved successfully' })
  async getMomentsByLocation(
    @Param('location') location: string,
    @Query('limit') limit?: number,
  ) {
    return await this.momentsService.getMomentsByLocation(location, limit);
  }

  @Get('locations')
  @ApiOperation({ summary: 'Get all locations' })
  @ApiResponse({ status: 200, description: 'Locations retrieved successfully' })
  async getAllLocations() {
    return await this.momentsService.getAllLocations();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get moment by ID' })
  @ApiResponse({ status: 200, description: 'Moment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Moment not found' })
  async findOne(@Param('id') id: string) {
    return this.momentsService.findOnePublic(id);
  }

  @Post(':id/view')
  @Public()
  @ApiOperation({ summary: 'Increment moment view count' })
  @ApiResponse({ status: 200, description: 'View count incremented successfully' })
  @ApiResponse({ status: 404, description: 'Moment not found' })
  async incrementView(@Param('id') id: string) {
    return this.momentsService.incrementView(id);
  }

  @Post(':id/like')
  @Public()
  @ApiOperation({ summary: 'Like a moment' })
  @ApiResponse({ status: 200, description: 'Moment liked successfully' })
  @ApiResponse({ status: 404, description: 'Moment not found' })
  async incrementLike(@Param('id') id: string) {
    return this.momentsService.incrementLike(id);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new moment' })
  @ApiResponse({ status: 201, description: 'Moment created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createMomentDto: CreateMomentDto, @Request() req: Express.Request & { user: { id: string } }) {
    return await this.momentsService.create(createMomentDto, req.user.id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update your own moment' })
  @ApiResponse({ status: 200, description: 'Moment updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only edit your own moments' })
  @ApiResponse({ status: 404, description: 'Moment not found' })
  async update(
    @Param('id') id: string,
    @Body() updateMomentDto: UpdateMomentDto,
    @Request() req: Express.Request & { user: { id: string } },
  ) {
    return await this.momentsService.update(id, updateMomentDto, req.user.id);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete your own moment' })
  @ApiResponse({ status: 200, description: 'Moment deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only delete your own moments' })
  @ApiResponse({ status: 404, description: 'Moment not found' })
  async remove(@Param('id') id: string, @Request() req: Express.Request & { user: { id: string } }) {
    await this.momentsService.remove(id, req.user.id, false);
    return { message: 'Moment deleted successfully' };
  }
}