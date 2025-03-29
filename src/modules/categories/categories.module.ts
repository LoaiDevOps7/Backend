import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './categories.entity';
import { CategoryController } from './categories.controller';
import { CategoryService } from './categories.service';
import { CategoryRepository } from '@/infrastructure/repositories/category.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Category])],
  controllers: [CategoryController],
  providers: [CategoryService, CategoryRepository],
  exports: [CategoryRepository, CategoryService],
})
export class CategoryModule {}
