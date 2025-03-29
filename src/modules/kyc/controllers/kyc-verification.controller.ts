import {
  Controller,
  Post,
  Param,
  Body,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  Delete,
  Put,
  Get,
  UseGuards,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { mkdirSync } from 'fs';
import { extname } from 'path';
import { KycVerificationService } from '../services/kyc-verification.service';
import {
  CreateKycVerificationDto,
  VerificationStatus,
} from '../dto/create-kyc-verification.dto';
import { UpdateKycVerificationDto } from '../dto/update-kyc-verification.dto';
import { JwtGuard } from '@/core/guards/jwt.guard';

@Controller('kyc-verification')
// @UseGuards(JwtGuard)
export class KycVerificationController {
  constructor(
    private readonly kycVerificationService: KycVerificationService,
  ) {}

  @Post('create/:userId')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'faceImage', maxCount: 1 },
        { name: 'frontIdCardImage', maxCount: 1 },
        { name: 'backIdCardImage', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: (req, file, callback) => {
            const userId = req.params.userId;
            let category = '';
            if (file.fieldname === 'faceImage') {
              category = 'face';
            } else if (file.fieldname === 'frontIdCardImage') {
              category = 'id/front';
            } else if (file.fieldname === 'backIdCardImage') {
              category = 'id/back';
            }
            const uploadPath = `src/infrastructure/storage/uploads/${userId}/${category}`;
            mkdirSync(uploadPath, { recursive: true });
            callback(null, uploadPath);
          },
          filename: (req, file, callback) => {
            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
            const filename = `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`;
            callback(null, filename);
          },
        }),
      },
    ),
  )
  async createKycVerification(
    @Param('userId') userId: number,
    @Body() createKycVerificationDto: CreateKycVerificationDto,
    @UploadedFiles()
    files: {
      faceImage?: Express.Multer.File[];
      frontIdCardImage?: Express.Multer.File[];
      backIdCardImage?: Express.Multer.File[];
    },
  ) {
    if (!files.faceImage || !files.frontIdCardImage || !files.backIdCardImage) {
      throw new BadRequestException(
        'يجب رفع ثلاث صور: صورة الوجه وصورة البطاقة الأمامية والخلفية.',
      );
    }

    createKycVerificationDto.faceImage = files.faceImage[0].path;
    createKycVerificationDto.frontIdCardImage = files.frontIdCardImage[0].path;
    createKycVerificationDto.backIdCardImage = files.backIdCardImage[0].path;

    return this.kycVerificationService.createVerification(
      userId,
      createKycVerificationDto,
    );
  }

  @Get('get/:userId')
  async getVerification(@Param('userId') userId: number) {
    return this.kycVerificationService.getVerification(userId);
  }

  @Get()
  async getAllVerification() {
    return this.kycVerificationService.getAllVerification();
  }

  @Put('verification-status/:userId')
  async updateVerificationStatus(
    @Param('userId') userId: number,
    @Body('verificationStatus') verificationStatus: string,
  ) {
    return this.kycVerificationService.updateVerificationStatus(
      userId,
      verificationStatus,
    );
  }

  @Put('update/:userId')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'faceImage', maxCount: 1 },
        { name: 'frontIdCardImage', maxCount: 1 },
        { name: 'backIdCardImage', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: (req, file, callback) => {
            const userId = req.params.userId;
            let category = '';
            if (file.fieldname === 'faceImage') {
              category = 'face';
            } else if (file.fieldname === 'frontIdCardImage') {
              category = 'id/front';
            } else if (file.fieldname === 'backIdCardImage') {
              category = 'id/back';
            }
            const uploadPath = `src/infrastructure/storage/uploads/${userId}/${category}`;
            mkdirSync(uploadPath, { recursive: true });
            callback(null, uploadPath);
          },
          filename: (req, file, callback) => {
            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
            const filename = `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`;
            callback(null, filename);
          },
        }),
      },
    ),
  )
  async updateVerification(
    @Param('userId') userId: number,
    @Body() updateKycVerificationDto: UpdateKycVerificationDto,
    @UploadedFiles()
    files: {
      faceImage?: Express.Multer.File[];
      frontIdCardImage?: Express.Multer.File[];
      backIdCardImage?: Express.Multer.File[];
    },
  ) {
    // إذا تم رفع صور جديدة، يتم تحديث مساراتها في DTO
    if (files.faceImage && files.faceImage.length > 0) {
      updateKycVerificationDto.faceImage = files.faceImage[0].path;
    }
    if (files.frontIdCardImage && files.frontIdCardImage.length > 0) {
      updateKycVerificationDto.frontIdCardImage =
        files.frontIdCardImage[0].path;
    }
    if (files.backIdCardImage && files.backIdCardImage.length > 0) {
      updateKycVerificationDto.backIdCardImage = files.backIdCardImage[0].path;
    }

    return this.kycVerificationService.updateVerification(
      userId,
      updateKycVerificationDto,
    );
  }
}
