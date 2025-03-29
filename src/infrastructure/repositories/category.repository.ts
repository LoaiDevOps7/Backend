import { DataSource, Repository } from 'typeorm';
import { Category } from '@/modules/categories/categories.entity';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class CategoryRepository extends Repository<Category> {
  constructor(private dataSource: DataSource) {
    super(Category, dataSource.createEntityManager());
  }

  // وظيفة للبحث عن فئة باستخدام الـ ID
  async findById(id: string): Promise<Category> {
    try {
      const category = await this.findOne({ where: { id } });
      if (!category) {
        throw new NotFoundException(`Category with id ${id} not found`);
      }
      return category;
    } catch {
      throw new InternalServerErrorException('Error while retrieving category');
    }
  }

  async createCategory(categoryData: Partial<Category>): Promise<Category> {
    const category = this.create(categoryData);
    try {
      return await this.save(category);
    } catch {
      throw new Error('Failed to create bid');
    }
  }

  // وظيفة لجلب جميع الفئات
  async findAllCategories(): Promise<Category[]> {
    try {
      return await this.find();
    } catch {
      throw new InternalServerErrorException(
        'Error while fetching all categories',
      );
    }
  }
}
