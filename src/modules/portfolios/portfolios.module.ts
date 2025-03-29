import { Module } from '@nestjs/common';
import { PortfoliosController } from './portfolios.controller';
import { PortfoliosService } from './portfolios.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Portfolio } from './portfolios.entity';
import { UserModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([Portfolio]), UserModule, JwtModule],
  controllers: [PortfoliosController],
  providers: [PortfoliosService],
})
export class PortfoliosModule {}
