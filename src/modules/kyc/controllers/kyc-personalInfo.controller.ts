import {
  Controller,
  Post,
  Param,
  Body,
  Get,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Put,
} from '@nestjs/common';
import { KycPersonalInfoService } from '../services/kyc-personal-info.service';
import { CreatePersonalInfoDto } from '../dto/create-personal-info.dto';
import { UpdatePersonalInfoDto } from '../dto/update-personal-info.dto';
import { JwtGuard } from '@/core/guards/jwt.guard';
import { mkdirSync } from 'fs';
import { unlink } from 'fs/promises';
import { extname } from 'path';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { AddSkillsDto } from '../dto/add-skills.dto';
import { Skill } from '../entitys/skill.entity';

@Controller('kyc-personal-info')
@UseGuards(JwtGuard)
export class KycPersonalInfoController {
  constructor(private readonly personalInfoService: KycPersonalInfoService) {}

  @Post('create/:userId')
  @UseInterceptors(
    FileInterceptor('profileImage', {
      storage: diskStorage({
        destination: (req, file, callback) => {
          const userId = req.params.userId;
          const uploadPath = `src/infrastructure/storage/uploads/${userId}/profile`;
          mkdirSync(uploadPath, { recursive: true });
          callback(null, uploadPath);
        },
        filename: (req, file, callback) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const filename = `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`;
          callback(null, filename);
        },
      }),
    }),
  )
  async createPersonalInfo(
    @Param('userId') userId: number,
    @Body() createPersonalInfoDto: CreatePersonalInfoDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('يجب رفع صورة الملف الشخصي');
    }
    createPersonalInfoDto.profileImage = file.path;
    return this.personalInfoService.createPersonalInfo(
      userId,
      createPersonalInfoDto,
    );
  }

  @Post(':personalInfoId/skills')
  async addSkillsToPersonalInfo(
    @Param('personalInfoId') personalInfoId: string,
    @Body() addSkillsDto: AddSkillsDto,
  ) {
    const skillsArray = Array.isArray(addSkillsDto.skills)
      ? addSkillsDto.skills
      : [addSkillsDto.skills];

    return await this.personalInfoService.addSkillsToPersonalInfo(
      personalInfoId,
      skillsArray,
    );
  }

  @Get('get/:userId')
  async getPersonalInfo(@Param('userId') userId: number) {
    return this.personalInfoService.getPersonalInfo(userId);
  }

  @Put('update/:userId')
  @UseInterceptors(
    FileInterceptor('profileImage', {
      storage: diskStorage({
        destination: (req, file, callback) => {
          const userId = req.params.userId;
          const uploadPath = `src/infrastructure/storage/uploads/${userId}/profile`;
          mkdirSync(uploadPath, { recursive: true });
          callback(null, uploadPath);
        },
        filename: (req, file, callback) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const filename = `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`;
          callback(null, filename);
        },
      }),
    }),
  )
  async updatePersonalInfo(
    @Param('userId') userId: number,
    @Body() updatePersonalInfoDto: UpdatePersonalInfoDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // استرجاع الملف الشخصي الحالي
    const currentProfile =
      await this.personalInfoService.getPersonalInfo(userId);
    if (file) {
      // إذا تم إرسال ملف جديد، نحذف الصورة القديمة إن وجدت
      if (currentProfile && currentProfile.profileImage) {
        try {
          await unlink(currentProfile.profileImage);
        } catch (err) {
          console.error('فشل حذف الصورة القديمة:', err);
        }
      }
      updatePersonalInfoDto.profileImage = file.path;
    }
    return this.personalInfoService.updatePersonalInfo(
      userId,
      updatePersonalInfoDto,
    );
  }

  @Delete(':personalInfoId/skills/:skillName')
  async removeSkill(
    @Param('personalInfoId') personalInfoId: string,
    @Param('skillName') skillName: string,
  ) {
    return await this.personalInfoService.removeSkillFromPersonalInfo(
      personalInfoId,
      skillName,
    );
  }

  @Get('getAll/skills')
  async getAllSkills(): Promise<Skill[]> {
    return await this.personalInfoService.getAllSkills();
  }
}
