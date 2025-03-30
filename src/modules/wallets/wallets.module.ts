import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from './wallets.entity';
import { WalletRepository } from '@/infrastructure/repositories/wallet.repository';
import { WalletService } from './wallets.service';
import { CurrencyExchangeService } from './currency-exchange.service';
import { UserModule } from '../users/users.module';
import { WalletController } from './wallets.controller';
import { JwtModule } from '@nestjs/jwt';
import { NotificationModule } from '../notifications/notification.module';
import { TransactionRepository } from '@/infrastructure/repositories/transaction.repository';
import { Transaction } from './transactions.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, Transaction]),
    UserModule,
    JwtModule,
    NotificationModule,
  ],
  controllers: [WalletController],
  providers: [
    WalletService,
    WalletRepository,
    CurrencyExchangeService,
    TransactionRepository,
  ],
  exports: [WalletService, WalletRepository],
})
export class WalletModule {}
