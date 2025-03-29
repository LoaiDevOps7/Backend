import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './projects.entity';
import { ProjectController } from './projects.controller';
import { ProjectService } from './projects.service';
import { ProjectRepository } from '@/infrastructure/repositories/project.repository';
import { WalletModule } from '../wallets/wallets.module';
import { BidModule } from '../bids/bid.module';
import { UserModule } from '../users/users.module';
import { CategoryModule } from '../categories/categories.module';
import { NotificationModule } from '../notifications/notification.module';
import { JwtModule } from '@nestjs/jwt';
import { Contract } from '../chats/contract.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Contract]),
    forwardRef(() => BidModule),
    WalletModule,
    UserModule,
    CategoryModule,
    NotificationModule,
    JwtModule,
  ],
  controllers: [ProjectController],
  providers: [ProjectService, ProjectRepository],
  exports: [ProjectService],
})
export class ProjectModule {}
