import { Module } from '@nestjs/common';
import { UserModule } from '../users/users.module';
import { AdminController } from './admin.controller';
import { ProjectModule } from '../projects/projects.module';
import { CategoryModule } from '../categories/categories.module';
import { AdminService } from './admin.service';
import { Admin } from './admin.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PackageModule } from '../packages/package.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin]),
    UserModule,
    ProjectModule,
    CategoryModule,
    PackageModule,
  ],
  providers: [AdminService],
  controllers: [AdminController],
  exports: [AdminService],
})
export class AdminModule {}
