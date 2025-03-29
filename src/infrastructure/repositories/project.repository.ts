import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Project } from '@/modules/projects/projects.entity';

@Injectable()
export class ProjectRepository extends Repository<Project> {
  constructor(private dataSource: DataSource) {
    super(Project, dataSource.createEntityManager());
  }

  async createProject(projectData: Partial<Project>): Promise<Project> {
    const project = this.create(projectData);
    try {
      return await this.save(project);
    } catch {
      throw new Error('Failed to create project');
    }
  }

  // وظيفة للبحث عن مشاريع بناءً على الفئة أو الحالة أو المالك
  async findByCategory(categoryId: string): Promise<Project[]> {
    return this.find({
      where: { category: { id: categoryId } },
      relations: ['category', 'owner.personalInfo'],
    });
  }

  async findByOwner(ownerId: number): Promise<Project[]> {
    return this.find({
      where: { owner: { id: ownerId } },
      relations: ['category', 'owner.personalInfo'],
    });
  }

  // وظيفة للبحث عن جميع المشاريع
  async findAllProjects(): Promise<Project[]> {
    return this.find({ relations: ['category', 'owner.personalInfo.job'] });
  }
}
