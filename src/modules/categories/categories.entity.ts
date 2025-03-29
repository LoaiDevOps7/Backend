import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Project } from '../projects/projects.entity';

@Entity('Categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @OneToMany(() => Project, (project) => project.category)
  projects: Project[];
}
