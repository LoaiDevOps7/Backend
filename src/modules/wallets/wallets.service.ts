import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WalletRepository } from '@/infrastructure/repositories/wallet.repository';
import { UsersService } from '../users/users.service';
import { Wallet } from './wallets.entity';
import { CurrencyExchangeService } from './currency-exchange.service';
import { NotificationService } from '../notifications/notification.service';
import { TransactionRepository } from '@/infrastructure/repositories/transaction.repository';
import { Transaction, TransactionType } from './transactions.entity';
import { NotificationChannel } from '../notifications/types/notification.types';

@Injectable()
export class WalletService {
  private readonly COMMISSION_RATE = 0.1;
  constructor(
    private readonly walletRepository: WalletRepository,
    private readonly usersService: UsersService,
    private readonly currencyExchangeService: CurrencyExchangeService,
    private readonly notificationService: NotificationService,
    private readonly transactionRepository: TransactionRepository,
  ) {}

  // إنشاء محفظة جديدة للمستخدم عند التسجيل
  async createWallet(
    userId: number,
    currency: string = 'SPY',
  ): Promise<Wallet> {
    // البحث عن المستخدم باستخدام الـ userId
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    // التأكد من عدم وجود محفظة سابقة للمستخدم
    if (user.wallet) throw new BadRequestException('User already has a wallet');

    // إنشاء الكيان الخاص بالمحفظة
    const wallet = this.walletRepository.create({
      user,
      balance: 0,
      currency,
      availableBalance: 0, // الرصيد القابل للسحب
      pendingBalance: 0, // الرصيد المعلق
    });

    // إرسال إشعار للمستخدم بأنه تم إنشاء المحفظة
    await this.notificationService.sendNotification(
      'wallet_created',
      user.email,
      { currency },
      [NotificationChannel.EMAIL],
    );

    // حفظ المحفظة في قاعدة البيانات
    return this.walletRepository.save(wallet);
  }

  // الحصول على محفظة المستخدم
  async getWallet(userId: number): Promise<Wallet> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // البحث عن المحفظة الخاصة بالمستخدم
    const wallet = await this.walletRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'], // تحميل علاقة المستخدم إذا كانت معرفة في كيان المحفظة
    });

    if (!wallet) {
      throw new BadRequestException('Wallet not found');
    }

    return wallet;
  }

  // إضافة رصيد إلى محفظة المستخدم مع تخصيص 20% كرأس مال معلق
  async addFunds(
    userId: number,
    amount: number,
    currency: string,
  ): Promise<Wallet> {
    const wallet = await this.getWallet(userId);

    // تحويل العملة إذا كانت مختلفة
    if (wallet.currency !== currency) {
      amount = await this.currencyExchangeService.convertCurrency(
        amount,
        currency,
        wallet.currency,
      );
    }

    // حساب المبالغ: 80% متاح و20% معلق
    const availableAmount = amount * 0.8;
    const pendingAmount = amount * 0.2;

    // تحديث الرصيد القابل للسحب والرصيد المعلق وإجمالي الرصيد
    wallet.availableBalance += availableAmount;
    wallet.pendingBalance += pendingAmount;
    wallet.balance = wallet.availableBalance + wallet.pendingBalance;

    await this.walletRepository.save(wallet);

    // تسجيل العملية في سجل المعاملات (يُسجل العملية بالمبلغ الكامل)
    await this.recordTransaction(
      userId,
      wallet,
      amount,
      wallet.currency,
      TransactionType.DEPOSIT,
    );

    this.notificationService.sendNotification(
      'funds_added',
      wallet.user.email,
      { amount, currency },
      [NotificationChannel.EMAIL],
    );

    return wallet;
  }

  // خصم رصيد من المحفظة
  async deductFunds(
    userId: number,
    amount: number,
    currency: string,
  ): Promise<Wallet> {
    const wallet = await this.getWallet(userId);

    // تحويل العملة إذا كانت مختلفة
    if (wallet.currency !== currency) {
      amount = await this.currencyExchangeService.convertCurrency(
        amount,
        currency,
        wallet.currency,
      );
    }

    if (wallet.balance < amount)
      throw new BadRequestException('Insufficient funds');

    wallet.balance -= amount;
    await this.walletRepository.save(wallet);

    // تسجيل العملية مع تعيين الحالة إلى completed وربطها بالمحفظة
    await this.recordTransaction(
      userId,
      wallet,
      -amount,
      wallet.currency,
      TransactionType.WITHDRAWAL,
    );

    this.notificationService.sendNotification(
      'funds_deducted',
      wallet.user.email,
      { amount, currency },
      [NotificationChannel.EMAIL],
    );

    return wallet;
  }

  // تحويل رصيد إلى محفظة فريلانسر بعد إتمام المشروع
  async transferToFreelancer(
    userId: number,
    amount: number,
    currency: string,
  ): Promise<Wallet> {
    const wallet = await this.deductFunds(userId, amount, currency);
    const commission = amount * this.COMMISSION_RATE;
    const amountAfterCommission = amount - commission;
    this.notificationService.sendNotification(
      'funds_transferred_to_freelancer',
      wallet.user.email,
      { amount: amountAfterCommission, currency },
      [NotificationChannel.EMAIL],
    );
    return wallet;
  }

  // إضافة الأموال إلى المحفظة لحساب الموقع عند قبول العرض
  async transferToSiteAccount(
    adminId: number,
    amount: number,
    currency: string,
  ): Promise<Wallet> {
    const siteWallet = await this.walletRepository.findOne({
      where: { admin: { id: adminId }, currency },
    });
    if (!siteWallet) {
      throw new Error('Site wallet not found');
    }
    // زيادة رصيد حساب الموقع
    siteWallet.balance += amount;
    return await this.walletRepository.save(siteWallet);
  }

  /**
   * holdFundsInEscrow: يقوم بخصم مبلغ من حساب الفريلانسر واحتجازه في حساب مؤقت (Escrow)
   * يمكن استرجاع المبلغ لاحقًا عند التأكيد النهائي للمشروع أو إعادة المبلغ في حال وجود مشكلات.
   */
  async holdFundsInEscrow(
    freelancerId: number,
    amount: number,
    currency: string,
  ): Promise<void> {
    const wallet = await this.walletRepository.findOne({
      where: { user: { id: freelancerId }, currency },
    });
    if (!wallet) {
      throw new Error('Wallet not found for freelancer');
    }

    // التأكد من كفاية الرصيد
    if (wallet.balance < amount) {
      throw new Error('Insufficient funds to hold in escrow');
    }

    // خصم المبلغ من الرصيد الفوري
    wallet.balance -= amount;

    // زيادة قيمة المبلغ المحتجز في حساب Escrow (افتراض وجود حقل escrow في كيان Wallet)
    wallet.escrow = (wallet.escrow || 0) + amount;

    await this.walletRepository.save(wallet);
  }

  // دوال إضافية للتعامل مع حساب Escrow (مثل الإفراج عن المبلغ بعد التأكيد النهائي)
  async releaseEscrowFunds(
    freelancerId: number,
    amount: number,
    currency: string,
  ): Promise<void> {
    const wallet = await this.walletRepository.findOne({
      where: { user: { id: freelancerId }, currency },
    });
    if (!wallet || !wallet.escrow || wallet.escrow < amount) {
      throw new Error('Insufficient escrow funds to release');
    }
    // تقليل المبلغ المحتجز وإضافته إلى الرصيد النهائي للفريلانسر
    wallet.escrow -= amount;
    wallet.balance += amount;
    await this.walletRepository.save(wallet);
  }

  // استرداد الأموال Refund
  async refundTransaction(
    userId: number,
    transactionId: string,
  ): Promise<Wallet> {
    const wallet = await this.getWallet(userId);
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId, user: { id: userId } },
    });

    if (!transaction) throw new NotFoundException('Transaction not found');
    if (transaction.amount > 0)
      throw new BadRequestException('Cannot refund a deposit');

    const commission = Math.abs(transaction.amount) * this.COMMISSION_RATE;
    const amountAfterCommission = Math.abs(transaction.amount) - commission;

    wallet.balance += amountAfterCommission;
    await this.walletRepository.save(wallet);

    // تسجيل عملية الاسترداد مع تعيين الحالة إلى completed وربطها بالمحفظة
    await this.recordTransaction(
      userId,
      wallet,
      amountAfterCommission,
      wallet.currency,
      TransactionType.REFUND,
    );

    this.notificationService.sendNotification(
      'refund_processed',
      wallet.user.email,
      { amount: amountAfterCommission, currency: wallet.currency },
      [NotificationChannel.EMAIL],
    );

    return wallet;
  }

  // استرجاع سجل المعاملات
  async getTransactions(userId: number): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { user: { id: userId } },
      relations: [
        'user',
        'user.personalInfo',
        'user.kycVerification',
        'wallet',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  // تسجيل العملية في سجل المعاملات مع تعيين الحالة إلى completed وربط العملية بالمحفظة
  private async recordTransaction(
    userId: number,
    wallet: Wallet,
    amount: number,
    currency: string,
    type: TransactionType,
  ) {
    const user = await this.usersService.findById(userId);
    const transaction = this.transactionRepository.create({
      amount,
      user,
      wallet, // تعيين العلاقة مع المحفظة
      currency,
      type,
      status: 'completed', // تحديث الحالة إلى completed
    });
    await this.transactionRepository.save(transaction);
  }
}
