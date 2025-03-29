import { Injectable } from '@nestjs/common';
import { Category } from './categories.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoryRepository } from '@/infrastructure/repositories/category.repository';

@Injectable()
export class CategoryService {
  constructor(private categoryRepository: CategoryRepository) {}

  async createCategory(
    createCategoryDto: CreateCategoryDto,
  ): Promise<Category> {
    return this.categoryRepository.createCategory(createCategoryDto);
  }

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.findAllCategories();
  }

  async findById(id: string): Promise<Category> {
    return this.categoryRepository.findById(id);
  }
}
