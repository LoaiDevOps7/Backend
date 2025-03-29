import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { PortfoliosService } from './portfolios.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { mkdirSync } from 'fs';
import { extname } from 'path';
import { JwtGuard } from '@/core/guards/jwt.guard';

@Controller('portfolios')
@UseGuards(JwtGuard)
export class PortfoliosController {
  constructor(private readonly portfoliosService: PortfoliosService) {}

  // إنشاء معرض جديد
  @Post('create/:userId')
  @UseInterceptors(
    FilesInterceptor('imageUrl', 3, {
      storage: diskStorage({
        destination: (req, file, callback) => {
          const userId = req.params.userId;
          const category = 'portfolio';

          // تحديد مسار رفع الصور بناءً على userId وفئة portfolio
          const uploadPath = `src/infrastructure/storage/uploads/${userId}/${category}`;

          // التأكد من أن المجلد موجود، وإذا لم يكن يتم إنشاؤه
          mkdirSync(uploadPath, { recursive: true });

          callback(null, uploadPath);
        },
        filename: (req, file, callback) => {
          // إنشاء اسم فريد للملف بناءً على الوقت
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const filename = `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`;
          callback(null, filename);
        },
      }),
    }),
  )
  async createPortfolio(
    @Param('userId') userId: number,
    @Body() createPortfolioDto: CreatePortfolioDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    createPortfolioDto.imageUrl = this.getImageUrl(files);
    return this.portfoliosService.createPortfolio(userId, createPortfolioDto);
  }

  // دالة مساعدة لاستخراج رابط الصورة الأولى
  private getImageUrl(files: Express.Multer.File[]): string {
    const imageUrlFile = files.find((file) => file.fieldname === 'imageUrl');
    if (!imageUrlFile) {
      throw new BadRequestException('يجب رفع صورة رئيسية للمعرض.');
    }
    return imageUrlFile.path;
  }

  // الحصول على معرض المستخدم
  @Get(':userId')
  async getUserPortfolio(@Param('userId') userId: number) {
    const portfolio = await this.portfoliosService.getUserPortfolio(userId);
    if (!portfolio) {
      throw new BadRequestException('لا يوجد معرض لهذا المستخدم.');
    }
    return portfolio;
  }
}
