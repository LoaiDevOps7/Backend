import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TranslationService } from './translation.service';
import { TranslationController } from './translation.controller';
import { Translation } from './translation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Translation])],
  controllers: [TranslationController],
  providers: [TranslationService],
  exports: [TranslationService],
})
export class TranslationModule {}
