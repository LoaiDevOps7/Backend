import { Controller, Param, Get, UseGuards, Patch, Body } from '@nestjs/common';
import { JwtGuard } from '@/core/guards/jwt.guard';
import { Wallet } from './wallets.entity';
import { WalletService } from './wallets.service';
import { Transaction } from './transactions.entity';

@Controller('wallets')
// @UseGuards(JwtGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('get/:userId')
  async getWalletUser(@Param('userId') userId: number): Promise<Wallet> {
    return this.walletService.getWallet(userId);
  }

  // Endpoint للحصول على محفظة المستخدم
  @Get('get/:userId')
  async getWallet(@Param('userId') userId: number): Promise<Wallet> {
    return this.walletService.getWallet(userId);
  }

  // Endpoint لإضافة رصيد إلى المحفظة
  @Patch('add/:userId')
  async addFunds(
    @Param('userId') userId: number,
    @Body() body: { amount: number; currency: string },
  ): Promise<Wallet> {
    return this.walletService.addFunds(userId, body.amount, body.currency);
  }

  // Endpoint لخصم رصيد من المحفظة
  @Patch('deduct/:userId')
  async deductFunds(
    @Param('userId') userId: number,
    @Body() body: { amount: number; currency: string },
  ): Promise<Wallet> {
    return this.walletService.deductFunds(userId, body.amount, body.currency);
  }

  // Endpoint لتحويل رصيد إلى محفظة فريلانسر بعد إتمام المشروع
  @Patch('transfer-freelancer/:userId')
  async transferToFreelancer(
    @Param('userId') userId: number,
    @Body() body: { amount: number; currency: string },
  ): Promise<Wallet> {
    return this.walletService.transferToFreelancer(
      userId,
      body.amount,
      body.currency,
    );
  }

  // Endpoint لإضافة الأموال إلى حساب الموقع عند قبول العرض
  @Patch('transfer-site/:userId')
  async transferToSiteAccount(
    @Param('userId') userId: number,
    @Body() body: { amount: number; currency: string },
  ): Promise<Wallet> {
    return this.walletService.transferToSiteAccount(
      userId,
      body.amount,
      body.currency,
    );
  }

  // Endpoint لاسترداد الأموال (Refund)
  @Patch('refund/:userId/:transactionId')
  async refundTransaction(
    @Param('userId') userId: number,
    @Param('transactionId') transactionId: string,
  ): Promise<Wallet> {
    return this.walletService.refundTransaction(userId, transactionId);
  }

  // Endpoint لاسترجاع سجل المعاملات الخاصة بالمستخدم
  @Get('transactions/:userId')
  async getTransactions(
    @Param('userId') userId: number,
  ): Promise<Transaction[]> {
    return this.walletService.getTransactions(userId);
  }
}
