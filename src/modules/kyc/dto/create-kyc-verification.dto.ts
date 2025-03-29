import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export enum VerificationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export class CreateKycVerificationDto {
  @IsNotEmpty()
  @IsString()
  frontIdCardImage: string;

  @IsNotEmpty()
  @IsString()
  backIdCardImage: string;

  @IsNotEmpty()
  @IsString()
  faceImage: string;

  @IsNotEmpty()
  @IsString()
  governmentId: string;

  @IsEnum(VerificationStatus)
  @IsNotEmpty()
  verificationStatus: VerificationStatus;
}
