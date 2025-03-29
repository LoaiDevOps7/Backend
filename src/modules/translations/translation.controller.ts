import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { TranslationService } from './translation.service';
import { Translation } from './translation.entity';

@Controller('translations')
export class TranslationController {
  constructor(private readonly translationService: TranslationService) {}

  @Post()
  async createTranslation(
    @Body() body: { key: string; values: Record<string, string> },
  ): Promise<Translation> {
    return this.translationService.createTranslation(body.key, body.values);
  }

  @Put(':key')
  async updateTranslation(
    @Param('key') key: string,
    @Body() body: { values: Record<string, string> },
  ): Promise<Translation> {
    return this.translationService.updateTranslation(key, body.values);
  }

  @Get(':key')
  async getTranslation(
    @Param('key') key: string,
  ): Promise<Translation | undefined> {
    return this.translationService.getTranslation(key);
  }

  @Get()
  async getAllTranslations(): Promise<Translation[]> {
    return this.translationService.getAllTranslations();
  }

  @Delete(':key')
  async deleteTranslation(@Param('key') key: string): Promise<void> {
    return this.translationService.deleteTranslation(key);
  }
}
