import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rating } from './ratings.entity';
import { RatingService } from './ratings.service';
import { RatingController } from './ratings.controller';
import { ProjectModule } from '../projects/projects.module';
import { UserModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([Rating]),
    ProjectModule,
    UserModule,
    JwtModule,
  ],
  providers: [RatingService],
  controllers: [RatingController],
})
export class RatingModule {}
