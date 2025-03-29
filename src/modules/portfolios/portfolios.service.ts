import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portfolio } from './portfolios.entity';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class PortfoliosService {
  constructor(
    @InjectRepository(Portfolio)
    private portfoliosRepository: Repository<Portfolio>,
    private usersService: UsersService,
  ) {}

  // إنشاء معرض جديد
  async createPortfolio(
    userId: number,
    createPortfolioDto: CreatePortfolioDto,
  ): Promise<Portfolio> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new Error('المستخدم غير موجود');
    }

    const portfolio = this.portfoliosRepository.create({
      ...createPortfolioDto,
      user,
    });
    return this.portfoliosRepository.save(portfolio);
  }

  // الحصول على معرض المستخدم
  async getUserPortfolio(userId: number): Promise<Portfolio[]> {
    return this.portfoliosRepository.find({ where: { user: { id: userId } } });
  }
}
