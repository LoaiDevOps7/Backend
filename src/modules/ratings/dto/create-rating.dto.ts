import {
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max,
  IsNumber,
  IsIn,
} from 'class-validator';

export class CreateRatingDto {
  // المعايير الأساسية (1-5)
  // @IsInt()
  // @Min(1)
  // @Max(5)
  // ratingSpeed: number;

  @IsInt()
  @Min(1)
  @Max(5)
  ratingProfessionalism: number;

  // @IsInt()
  // @Min(1)
  // @Max(5)
  // ratingResponse: number;

  // المعايير الإضافية (اختيارية)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  ratingQuality?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  ratingTimeliness?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  ratingCommunication?: number;

  // المعايير الجديدة
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  ratingExpertise?: number; // الخبرة بالمجال

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  ratingRepeat?: number; // معاودة التعامل

  // اقتراحات للتحسين (نص اختياري)
  // @IsOptional()
  // @IsString()
  // improvementSuggestions?: string;

  // تعليق عام (نص اختياري)
  @IsOptional()
  @IsString()
  comment?: string;

  // نسبة الالتزام بالمواعيد (مثلاً 95)
  // @IsOptional()
  // @IsNumber()
  // timelinessPercentage?: number;

  // التقييم التفصيلي: مثال { execution: 4, delivery: 5, postDeliverySupport: 3 }
  // @IsOptional()
  // @IsObject()
  // detailedRatings?: {
  //   execution?: number;
  //   delivery?: number;
  //   postDeliverySupport?: number;
  // };

  // معرف المستخدم الذي يتم تقييمه
  @IsNumber()
  ratedId: number;

  @IsNumber()
  raterId: number;

  // دور المستخدم الذي يتم تقييمه (يجب أن يكون "owner" أو "freelancer")
  @IsString()
  @IsIn(['owner', 'freelancer'])
  ratedRole: string;

  @IsString()
  @IsIn(['owner', 'freelancer'])
  raterRole: string;

  // معرف المشروع المرتبط بالتقييم
  @IsString()
  projectId: string;
}
