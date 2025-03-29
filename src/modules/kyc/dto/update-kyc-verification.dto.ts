import { PartialType } from '@nestjs/mapped-types';
import { CreateKycVerificationDto } from './create-kyc-verification.dto';

export class UpdateKycVerificationDto extends PartialType(
  CreateKycVerificationDto,
) {}
