import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AdminGuard } from '@/core/guards/admin.guard';
import { ProjectService } from '../projects/projects.service';
import { CategoryService } from '../categories/categories.service';
import { RolesGuard } from '@/core/guards/roles.guard';
import { Roles } from '@/core/decorators/roles.decorator';
import { PackageService } from '../packages/package.service';

@Controller('admin')
@UseGuards(RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(
    private readonly usersService: UsersService,
    private readonly projectService: ProjectService,
    private readonly categoryService: CategoryService,
    private readonly packageService: PackageService,
  ) {}

  @Get('users')
  getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Get('projects')
  getAllProjects() {
    return this.projectService.findAll();
  }

  @Get('categories')
  getAllCategories() {
    return this.categoryService.findAll();
  }

  @Get('packages')
  async getAllPackages() {
    return this.packageService.getAllPackages();
  }
}
