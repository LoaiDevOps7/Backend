import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Theme } from './theme.entity';
import { Repository } from 'typeorm';
import { CreateThemeDto } from './dto/create-theme.dto';

@Injectable()
export class ThemesService {
  constructor(
    @InjectRepository(Theme)
    private themesRepository: Repository<Theme>,
  ) {}

  async createTheme(createThemeDto: CreateThemeDto): Promise<Theme> {
    const theme = this.themesRepository.create(createThemeDto);
    return await this.themesRepository.save(theme);
  }

  async findAll(): Promise<Theme[]> {
    return await this.themesRepository.find();
  }

  async getActiveTheme(): Promise<Theme | null> {
    return await this.themesRepository.findOne({ where: { isActive: true } });
  }

  async setActiveTheme(id: number): Promise<void> {
    await this.themesRepository.update({}, { isActive: false }); // تعطيل كل الثيمات
    await this.themesRepository.update(id, { isActive: true }); // تفعيل الثيم الجديد
  }
}
