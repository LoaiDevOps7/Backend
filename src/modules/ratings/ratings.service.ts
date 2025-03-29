import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rating } from './ratings.entity';
import { CreateRatingDto } from './dto/create-rating.dto';
import { ProjectService } from '../projects/projects.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class RatingService {
  private readonly logger = new Logger(RatingService.name);

  // تعريف أوزان المعايير لحساب المعدل الموزون
  // تمت إضافة معايير الخبرة بالمجال ومعاودة التعامل
  private readonly WEIGHTS = {
    // ratingSpeed: 1,
    ratingProfessionalism: 1.5,
    // ratingResponse: 1,
    ratingCommunication: 1,
    ratingQuality: 1,
    ratingExpertise: 1, // الخبرة بالمجال
    ratingTimeliness: 1,
    ratingRepeat: 1, // معاودة التعامل
    // detailedRatings: {
    //   execution: 1,
    //   delivery: 1,
    //   postDeliverySupport: 1,
    // },
  };

  constructor(
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
    private readonly projectService: ProjectService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * إنشاء تقييم جديد مع التحقق من حالة المشروع وأيضًا التحقق من أن التقييم متبادل بين Owner و Freelancer.
   * @param raterId معرف المستخدم الذي يقوم بالتقييم.
   * @param createRatingDto بيانات التقييم.
   * @param raterRole دور المستخدم الذي يقوم بالتقييم ("owner" أو "freelancer").
   */
  async createRating(createRatingDto: CreateRatingDto): Promise<Rating> {
    // التحقق من حالة المشروع إذا كان المقيّم (مثلاً الـ owner) لم يقم بالتقييم بعد انتهاء المشروع.
    if (createRatingDto.raterRole === 'Owner') {
      const project = await this.projectService.findOne(
        createRatingDto.projectId,
      );
      if (project.status === 'completed') {
        this.logger.warn(
          `Owner ${createRatingDto.raterId} attempted to rate finished project ${createRatingDto.projectId}`,
        );
        throw new BadRequestException(
          'لا يمكنك تقديم تقييم بعد انتهاء المشروع',
        );
      }
    }

    // التحقق من أن التقييم متبادل:
    // يجب على الـ owner تقييم freelancer والعكس صحيح.
    const ratedUser = await this.usersService.findById(createRatingDto.ratedId);
    if (
      createRatingDto.raterRole === 'Owner' &&
      !ratedUser.roles.includes('freelancer')
    ) {
      this.logger.warn(
        `Owner ${createRatingDto.raterId} attempted to rate a non-freelancer (${ratedUser.roles}) ${createRatingDto.ratedId}`,
      );
      throw new BadRequestException(
        'يجب على المالك (Owner) تقييم المستقل (Freelancer) فقط.',
      );
    }
    if (
      createRatingDto.raterRole === 'freelancer' &&
      !ratedUser.roles.includes('owner')
    ) {
      this.logger.warn(
        `Freelancer ${createRatingDto.raterId} attempted to rate a non-owner (${ratedUser.roles}) ${createRatingDto.ratedId}`,
      );
      throw new BadRequestException(
        'يجب على المستقل (Freelancer) تقييم المالك (Owner) فقط.',
      );
    }

    const rating = this.ratingRepository.create(createRatingDto);
    return this.ratingRepository.save(rating);
  }

  /**
   * استرجاع جميع التقييمات لمستخدم معين.
   * @param userId معرف المستخدم الذي يتم تقييمه.
   */
  async getRatingsForUser(userId: number): Promise<Rating[]> {
    return this.ratingRepository.find({
      where: { rated: { id: userId } },
      order: { createdAt: 'DESC' },
      relations: ['rater', 'rated', 'rater.personalInfo', 'rated.personalInfo'],
    });
  }

  /**
   * حساب المعدل الموزون لتقييم واحد.
   * @param record سجل التقييم.
   */
  private calculateWeightedRating(record: Rating): number {
    let sum = 0;
    let totalWeight = 0;

    const addRating = (value: number | undefined, weight: number) => {
      if (value !== undefined && value !== null) {
        sum += value * weight;
        totalWeight += weight;
      }
    };

    // addRating(record.ratingSpeed, this.WEIGHTS.ratingSpeed);
    addRating(record.ratingProfessionalism, this.WEIGHTS.ratingProfessionalism);
    // addRating(record.ratingResponse, this.WEIGHTS.ratingResponse);
    addRating(record.ratingQuality, this.WEIGHTS.ratingQuality);
    addRating(record.ratingTimeliness, this.WEIGHTS.ratingTimeliness);
    addRating(record.ratingCommunication, this.WEIGHTS.ratingCommunication);
    addRating(record.ratingExpertise, this.WEIGHTS.ratingExpertise);
    addRating(record.ratingRepeat, this.WEIGHTS.ratingRepeat);

    // if (record.detailedRatings) {
    //   const detailed: DetailedRatings = record.detailedRatings;
    //   addRating(detailed.execution, this.WEIGHTS.detailedRatings.execution);
    //   addRating(detailed.delivery, this.WEIGHTS.detailedRatings.delivery);
    //   addRating(
    //     detailed.postDeliverySupport,
    //     this.WEIGHTS.detailedRatings.postDeliverySupport,
    //   );
    // }

    return totalWeight > 0 ? sum / totalWeight : 0;
  }

  /**
   * حساب المعدل الموزون الإجمالي لمستخدم معين.
   * @param userId معرف المستخدم.
   */
  async getAverageRating(userId: number): Promise<number> {
    const ratings = await this.getRatingsForUser(userId);
    if (!ratings.length) {
      return 0;
    }
    const totalWeightedRating = ratings.reduce(
      (acc, record) => acc + this.calculateWeightedRating(record),
      0,
    );
    return totalWeightedRating / ratings.length;
  }

  /**
   * إنشاء تقرير تفصيلي لتحليل الأداء لمستخدم معين.
   * @param userId معرف المستخدم.
   */
  async getPerformanceAnalysis(userId: number): Promise<any> {
    const ratings = await this.getRatingsForUser(userId);
    if (!ratings.length) {
      return {
        averageWeightedRating: 0,
        totalRatings: 0,
        criteriaAverages: {},
      };
    }

    const criteriaSums = {
      // ratingSpeed: 0,
      ratingProfessionalism: 0,
      // ratingResponse: 0,
      ratingQuality: 0,
      ratingTimeliness: 0,
      ratingCommunication: 0,
      ratingExpertise: 0,
      ratingRepeat: 0,
      // detailedRatings: {
      //   execution: 0,
      //   delivery: 0,
      //   postDeliverySupport: 0,
      // },
    };

    const criteriaCounts = {
      // ratingSpeed: 0,
      ratingProfessionalism: 0,
      // ratingResponse: 0,
      ratingQuality: 0,
      ratingTimeliness: 0,
      ratingCommunication: 0,
      ratingExpertise: 0,
      ratingRepeat: 0,
      // detailedRatings: {
      //   execution: 0,
      //   delivery: 0,
      //   postDeliverySupport: 0,
      // },
    };

    let totalWeightedRating = 0;

    for (const record of ratings) {
      totalWeightedRating += this.calculateWeightedRating(record);

      // if (record.ratingSpeed !== undefined) {
      //   criteriaSums.ratingSpeed += record.ratingSpeed;
      //   criteriaCounts.ratingSpeed++;
      // }
      if (record.ratingProfessionalism !== undefined) {
        criteriaSums.ratingProfessionalism += record.ratingProfessionalism;
        criteriaCounts.ratingProfessionalism++;
      }
      // if (record.ratingResponse !== undefined) {
      //   criteriaSums.ratingResponse += record.ratingResponse;
      //   criteriaCounts.ratingResponse++;
      // }
      if (record.ratingQuality !== undefined) {
        criteriaSums.ratingQuality += record.ratingQuality;
        criteriaCounts.ratingQuality++;
      }
      if (record.ratingTimeliness !== undefined) {
        criteriaSums.ratingTimeliness += record.ratingTimeliness;
        criteriaCounts.ratingTimeliness++;
      }
      if (record.ratingCommunication !== undefined) {
        criteriaSums.ratingCommunication += record.ratingCommunication;
        criteriaCounts.ratingCommunication++;
      }
      if (record.ratingExpertise !== undefined) {
        criteriaSums.ratingExpertise += record.ratingExpertise;
        criteriaCounts.ratingExpertise++;
      }
      if (record.ratingRepeat !== undefined) {
        criteriaSums.ratingRepeat += record.ratingRepeat;
        criteriaCounts.ratingRepeat++;
      }
      // if (record.detailedRatings) {
      //   const detailed: DetailedRatings = record.detailedRatings;
      //   if (detailed.execution !== undefined) {
      //     criteriaSums.detailedRatings.execution += detailed.execution;
      //     criteriaCounts.detailedRatings.execution++;
      //   }
      //   if (detailed.delivery !== undefined) {
      //     criteriaSums.detailedRatings.delivery += detailed.delivery;
      //     criteriaCounts.detailedRatings.delivery++;
      //   }
      //   if (detailed.postDeliverySupport !== undefined) {
      //     criteriaSums.detailedRatings.postDeliverySupport +=
      //       detailed.postDeliverySupport;
      //     criteriaCounts.detailedRatings.postDeliverySupport++;
      //   }
      // }
    }

    const criteriaAverages = {
      // ratingSpeed: criteriaCounts.ratingSpeed
      //   ? criteriaSums.ratingSpeed / criteriaCounts.ratingSpeed
      //   : null,
      ratingProfessionalism: criteriaCounts.ratingProfessionalism
        ? criteriaSums.ratingProfessionalism /
          criteriaCounts.ratingProfessionalism
        : null,
      // ratingResponse: criteriaCounts.ratingResponse
      //   ? criteriaSums.ratingResponse / criteriaCounts.ratingResponse
      //   : null,
      ratingQuality: criteriaCounts.ratingQuality
        ? criteriaSums.ratingQuality / criteriaCounts.ratingQuality
        : null,
      ratingTimeliness: criteriaCounts.ratingTimeliness
        ? criteriaSums.ratingTimeliness / criteriaCounts.ratingTimeliness
        : null,
      ratingCommunication: criteriaCounts.ratingCommunication
        ? criteriaSums.ratingCommunication / criteriaCounts.ratingCommunication
        : null,
      ratingExpertise: criteriaCounts.ratingExpertise
        ? criteriaSums.ratingExpertise / criteriaCounts.ratingExpertise
        : null,
      ratingRepeat: criteriaCounts.ratingRepeat
        ? criteriaSums.ratingRepeat / criteriaCounts.ratingRepeat
        : null,
      // detailedRatings: {
      //   execution: criteriaCounts.detailedRatings.execution
      //     ? criteriaSums.detailedRatings.execution /
      //       criteriaCounts.detailedRatings.execution
      //     : null,
      //   delivery: criteriaCounts.detailedRatings.delivery
      //     ? criteriaSums.detailedRatings.delivery /
      //       criteriaCounts.detailedRatings.delivery
      //     : null,
      //   postDeliverySupport: criteriaCounts.detailedRatings.postDeliverySupport
      //     ? criteriaSums.detailedRatings.postDeliverySupport /
      //       criteriaCounts.detailedRatings.postDeliverySupport
      //     : null,
      // },
    };

    return {
      averageWeightedRating: totalWeightedRating / ratings.length,
      totalRatings: ratings.length,
      criteriaAverages,
    };
  }
}
