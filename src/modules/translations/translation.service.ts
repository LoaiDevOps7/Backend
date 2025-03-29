import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Translation } from './translation.entity';

@Injectable()
export class TranslationService {
  constructor(
    @InjectRepository(Translation)
    private readonly translationRepository: Repository<Translation>,
  ) {}

  async createTranslation(
    key: string,
    values: Record<string, string>,
  ): Promise<Translation> {
    const translation = this.translationRepository.create({ key, values });
    return this.translationRepository.save(translation);
  }

  async updateTranslation(
    key: string,
    values: Record<string, string>,
  ): Promise<Translation> {
    const translation = await this.translationRepository.findOne({
      where: { key },
    });
    if (!translation) {
      throw new Error(`Translation with key "${key}" not found.`);
    }
    translation.values = values;
    return this.translationRepository.save(translation);
  }

  async getTranslation(key: string): Promise<Translation | undefined> {
    return this.translationRepository.findOne({ where: { key } });
  }

  async getAllTranslations(): Promise<Translation[]> {
    return this.translationRepository.find() || [];
  }

  async deleteTranslation(key: string): Promise<void> {
    await this.translationRepository.delete({ key });
  }
}
