import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KycPersonalInfo } from '../entitys/kyc-personal-info.entity';
import { CreatePersonalInfoDto } from '../dto/create-personal-info.dto';
import { UpdatePersonalInfoDto } from '../dto/update-personal-info.dto';
import { KycVerificationService } from './kyc-verification.service';
import { VerificationStatus } from '../dto/create-kyc-verification.dto';
import { Job } from '../entitys/job.entity';
import { Skill } from '../entitys/skill.entity';

@Injectable()
export class KycPersonalInfoService {
  constructor(
    @InjectRepository(KycPersonalInfo)
    private readonly personalInfoRepository: Repository<KycPersonalInfo>,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(Skill)
    private readonly skillRepository: Repository<Skill>,
    private readonly kycVerificationService: KycVerificationService,
  ) {}

  async generateUsernameSuggestions(username: string): Promise<string[]> {
    const suggestions: string[] = [];
    // سنولد 3 اقتراحات بسيطة بإلحاق رقم
    for (let i = 1; i <= 3; i++) {
      const suggestion = `${username}${i}`;
      const exists = await this.personalInfoRepository.findOne({
        where: { username: suggestion },
      });
      if (!exists) {
        suggestions.push(suggestion);
      }
    }
    return suggestions;
  }

  async createPersonalInfo(
    userId: number,
    createPersonalInfoDto: CreatePersonalInfoDto,
  ): Promise<KycPersonalInfo> {
    // التحقق من وجود اسم المستخدم في قاعدة البيانات
    const existing = await this.personalInfoRepository.findOne({
      where: { username: createPersonalInfoDto.username },
    });
    if (existing) {
      const suggestions = await this.generateUsernameSuggestions(
        createPersonalInfoDto.username,
      );
      throw new BadRequestException({
        message:
          'اسم المستخدم موجود بالفعل. يرجى اختيار أحد الاقتراحات التالية:',
        suggestions,
      });
    }

    // البحث عن الوظيفة أو إنشاؤها بدون المهارات
    let jobEntity = await this.jobRepository.findOne({
      where: { name: createPersonalInfoDto.jobName },
    });

    if (!jobEntity) {
      jobEntity = this.jobRepository.create({
        name: createPersonalInfoDto.jobName,
      });
      await this.jobRepository.save(jobEntity);
    }

    // إنشاء الملف الشخصي وربطه بالمستخدم والوظيفة بدون المهارات
    const personalInfo = this.personalInfoRepository.create({
      ...createPersonalInfoDto,
      user: { id: userId },
      job: jobEntity || null, // الوظيفة بدون المهارات
    });

    return await this.personalInfoRepository.save(personalInfo);
  }

  async addSkillsToPersonalInfo(
    personalInfoId: string,
    skills: string[],
  ): Promise<KycPersonalInfo> {
    const personalInfo = await this.personalInfoRepository.findOne({
      where: { id: personalInfoId },
      relations: ['job', 'job.skills'],
    });

    if (!personalInfo) {
      throw new NotFoundException('لم يتم العثور على الملف الشخصي.');
    }

    if (!personalInfo.job) {
      throw new NotFoundException(
        'لم يتم العثور على الوظيفة المرتبطة بالملف الشخصي.',
      );
    }

    if (!Array.isArray(personalInfo.job.skills)) {
      personalInfo.job.skills = [];
    }

    const skillEntities: Skill[] = [];

    for (const skillName of skills) {
      let skill = await this.skillRepository.findOne({
        where: { name: skillName },
      });

      if (!skill) {
        skill = this.skillRepository.create({ name: skillName });
        await this.skillRepository.save(skill);
      }

      skillEntities.push(skill);
    }

    const newSkills = skillEntities.filter(
      (skill) =>
        !personalInfo.job.skills.some(
          (existingSkill) => existingSkill.id === skill.id,
        ),
    );

    if (newSkills.length > 0) {
      personalInfo.job.skills = [...personalInfo.job.skills, ...newSkills];

      await this.jobRepository.save(personalInfo.job);
      await this.personalInfoRepository.save(personalInfo);
    }

    return personalInfo;
  }

  async getPersonalInfo(userId: number): Promise<KycPersonalInfo> {
    const info = await this.personalInfoRepository.findOne({
      relations: ['user', 'user.kycVerification', 'job', 'job.skills'],
      where: { user: { id: userId } },
    });
    if (!info) {
      throw new NotFoundException('لم يتم العثور على المعلومات الشخصية');
    }
    return info;
  }

  async updatePersonalInfo(
    userId: number,
    updatePersonalInfoDto: UpdatePersonalInfoDto,
  ): Promise<KycPersonalInfo> {
    // استرجاع الملف الشخصي الحالي
    const info = await this.getPersonalInfo(userId);

    // التحقق من وجود اسم مستخدم آخر غير السجل الحالي
    const existing = await this.personalInfoRepository.findOne({
      where: { username: updatePersonalInfoDto.username },
    });
    if (existing && existing.id !== info.id) {
      const suggestions = await this.generateUsernameSuggestions(
        updatePersonalInfoDto.username,
      );
      throw new BadRequestException({
        message:
          'اسم المستخدم موجود بالفعل. يرجى اختيار أحد الاقتراحات التالية:',
        suggestions,
      });
    }

    // تحديد الحقول الحساسة التي تستدعي إعادة التوثيق عند تغييرها
    const sensitiveFields: (keyof UpdatePersonalInfoDto)[] = [
      'firstName',
      'lastName',
      'username',
      'dateOfBirth',
      'description',
      'profileImage',
      'city',
      'country',
      'jobName',
    ];

    // التحقق من حالة التوثيق الحالية
    const currentVerificationStatus =
      await this.kycVerificationService.getVerification(userId);

    console.log(currentVerificationStatus);

    // التحقق من تغيير أي من الحقول الحساسة
    const requiresVerificationReset = sensitiveFields.some(
      (field) =>
        updatePersonalInfoDto[field] !== undefined &&
        updatePersonalInfoDto[field] !== info[field],
    );

    if (!currentVerificationStatus) {
      await this.personalInfoRepository.update(userId, updatePersonalInfoDto);
    } else {
      if (requiresVerificationReset) {
        // إعادة تعيين حالة التوثيق إذا تم تغيير حقول حساسة
        this.kycVerificationService.updateVerificationStatus(
          userId,
          VerificationStatus.REJECTED,
        );
        this.kycVerificationService.deleteVerificationAndImages(userId);
      }
    }

    // في حالة تحديث الوظيفة أو المهارات فقط، لن يتم إعادة تعيين حالة التوثيق
    const updatedKyc = { ...info, ...updatePersonalInfoDto };
    return this.personalInfoRepository.save(updatedKyc);
  }

  async removeSkillFromPersonalInfo(
    personalInfoId: string,
    skillName: string,
  ): Promise<KycPersonalInfo> {
    const personalInfo = await this.personalInfoRepository.findOne({
      where: { id: personalInfoId },
      relations: ['job', 'job.skills'],
    });

    if (!personalInfo) {
      throw new NotFoundException('لم يتم العثور على الملف الشخصي.');
    }

    if (!personalInfo.job) {
      throw new NotFoundException(
        'لم يتم العثور على الوظيفة المرتبطة بالملف الشخصي.',
      );
    }

    if (!Array.isArray(personalInfo.job.skills)) {
      throw new BadRequestException('⚠️ لا يوجد مهارات لهذا الحساب.');
    }

    // البحث عن المهارة في القائمة
    const skillIndex = personalInfo.job.skills.findIndex(
      (skill) => skill.name === skillName,
    );

    if (skillIndex === -1) {
      throw new NotFoundException(`⚠️ المهارة "${skillName}" غير موجودة.`);
    }

    // إزالة المهارة من المصفوفة
    personalInfo.job.skills.splice(skillIndex, 1);

    // حفظ التحديثات
    await this.jobRepository.save(personalInfo.job);

    return personalInfo;
  }

  async getAllSkills(): Promise<Skill[]> {
    return this.skillRepository.find();
  }
}
