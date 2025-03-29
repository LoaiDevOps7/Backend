import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('Translations')
export class Translation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'translation_key' })
  key: string;

  @Column('json')
  values: Record<string, string>;
}
