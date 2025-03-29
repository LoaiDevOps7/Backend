import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { RatingService } from './ratings.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { JwtGuard } from '@/core/guards/jwt.guard';

@Controller('ratings')
@UseGuards(JwtGuard)
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  // إنشاء تقييم جديد
  @Post()
  async create(@Body() createRatingDto: CreateRatingDto) {
    return this.ratingService.createRating(createRatingDto);
  }

  // جلب جميع التقييمات لمستخدم معين
  @Get('user/:id')
  async getRatings(@Param('id') userId: number) {
    return this.ratingService.getRatingsForUser(userId);
  }

  // الحصول على المعدل الموزون لمستخدم معين
  @Get('user/:id/average')
  async getAverageRating(@Param('id') userId: number) {
    const average = await this.ratingService.getAverageRating(userId);
    return { average };
  }

  // تقرير تفصيلي لتحليل الأداء لمستخدم معين
  @Get('user/:id/analysis')
  async getPerformanceAnalysis(@Param('id') userId: number) {
    const analysis = await this.ratingService.getPerformanceAnalysis(userId);
    return analysis;
  }
}
