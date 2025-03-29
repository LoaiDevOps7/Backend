import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Patch,
  ParseIntPipe,
} from '@nestjs/common';
import { ProjectService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { Project } from './projects.entity';
import { Roles } from '@/core/decorators/roles.decorator';
import { RolesGuard } from '@/core/guards/roles.guard';
import { JwtGuard } from '@/core/guards/jwt.guard';

@Controller('projects')
@UseGuards(JwtGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  // إنشاء أو تحديث المشروع
  @Post()
  async create(@Body() createProjectDto: CreateProjectDto): Promise<Project> {
    return this.projectService.createProject(createProjectDto);
  }

  // قبول عرض لمشروع معين
  @Roles('Owner')
  @UseGuards(RolesGuard)
  @Post(':projectId/accept-bid/:bidId')
  async acceptBid(
    @Param('projectId') projectId: string,
    @Param('bidId') bidId: string,
  ): Promise<Project> {
    return this.projectService.acceptBid(projectId, bidId);
  }

  // رفض عرض لمشروع معين
  @Roles('Owner')
  @UseGuards(RolesGuard)
  @Post(':projectId/reject-bid/:bidId')
  async rejectBid(
    @Param('projectId') projectId: string,
    @Param('bidId') bidId: string,
  ): Promise<Project> {
    return this.projectService.rejectBid(projectId, bidId);
  }

  // نقل المشروع إلى مرحلة الاختبار
  @Roles('Owner')
  @UseGuards(RolesGuard)
  @Post(':projectId/send-to-testing')
  async sendToTesting(@Param('projectId') projectId: string): Promise<Project> {
    return this.projectService.sendProjectToTesting(projectId);
  }

  // إتمام المشروع
  @Roles('Owner', 'admin')
  @UseGuards(RolesGuard)
  @Patch(':projectId/complete')
  async completeProject(
    @Param('projectId') projectId: string,
  ): Promise<Project> {
    return this.projectService.completeProject(projectId);
  }

  // تحديث حالة المشروع (يمكن استخدامه لتحديث حالات أخرى)
  @Roles('Owner', 'admin')
  @UseGuards(RolesGuard)
  @Patch(':projectId/status')
  async updateStatus(
    @Param('projectId') projectId: string,
    @Body('status') status: string,
  ): Promise<Project> {
    return this.projectService.updateProjectStatus(projectId, status);
  }

  // الحصول على جميع المشاريع
  @Get()
  async findAll(): Promise<Project[]> {
    return this.projectService.findAll();
  }

  // الحصول على المشاريع حسب المالك
  @Get('owner/:ownerId')
  async findByOwner(
    @Param('ownerId', ParseIntPipe) ownerId: number,
  ): Promise<Project[]> {
    return this.projectService.findByOwner(ownerId);
  }

  @Get(':projectId')
  async findById(@Param('projectId') projectId: string): Promise<Project> {
    return this.projectService.findOne(projectId);
  }

  // الحصول على المشاريع حسب الفئة
  @Get('category/:categoryId')
  async findByCategory(
    @Param('categoryId') categoryId: string,
  ): Promise<Project[]> {
    return this.projectService.findByCategory(categoryId);
  }
}
