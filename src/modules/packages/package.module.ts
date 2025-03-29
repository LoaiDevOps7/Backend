import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PackageService } from './package.service';
import { PackageController } from './package.controller';
import { PackageRepository } from '@/infrastructure/repositories/package.repository';
import { Package } from './package.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Package, PackageRepository])],
  providers: [PackageService, PackageRepository],
  controllers: [PackageController],
  exports: [PackageRepository, PackageService],
})
export class PackageModule {}
