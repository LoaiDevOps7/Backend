import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bid } from './bids.entity';
import { BidController } from './bids.controller';
import { BidService } from './bids.service';
import { BidRepository } from '@/infrastructure/repositories/bid.repository';
import { ProjectModule } from '../projects/projects.module';
import { UserModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bid]),
    forwardRef(() => ProjectModule),
    UserModule,
    JwtModule,
  ],
  controllers: [BidController],
  providers: [BidService, BidRepository],
  exports: [BidRepository],
})
export class BidModule {}
