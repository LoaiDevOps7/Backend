import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ThemesService } from './themes.service';
import { CreateThemeDto } from './dto/create-theme.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';

@Controller('themes')
export class ThemesController {
  constructor(private readonly themesService: ThemesService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const { category } = req.body; // تحديد القسم بناءً على الطلب
          const { event } = req.body;

          // التأكد من وجود الفئة في الطلب
          if (!category) {
            return cb(new BadRequestException('Category is required'), null);
          }

          const uploadPath = `src/infrastructure/storage/uploads/${category}/${event}`;

          // إنشاء المجلد إذا لم يكن موجودًا
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }

          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  createTheme(@Body() createThemeDto: CreateThemeDto) {
    return this.themesService.createTheme(createThemeDto);
  }

  @Get()
  findAll() {
    return this.themesService.findAll();
  }

  @Get('active')
  getActiveTheme() {
    return this.themesService.getActiveTheme();
  }

  @Patch(':id/activate')
  activateTheme(@Param('id') id: string) {
    return this.themesService.setActiveTheme(+id);
  }
}
