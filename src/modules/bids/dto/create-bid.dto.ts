import {
  IsNumber,
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
} from 'class-validator';

export class CreateBidDto {
  @IsNumber()
  @IsNotEmpty()
  amount: number; // المبلغ المعروض

  @IsString()
  @IsNotEmpty()
  description: string; // وصف العرض

  @IsDateString()
  @IsNotEmpty()
  submittedAt: string; // تاريخ تقديم العرض

  @IsNumber()
  @IsNotEmpty()
  deliveryTime: number; // تاريخ تقديم العرض

  @IsString()
  @IsNotEmpty()
  projectId: string; // المشروع الذي تم تقديم العرض عليه

  @IsNumber()
  @IsNotEmpty()
  freelancerId: number; // المستقل الذي قدم العرض

  @IsNumber()
  @IsNotEmpty()
  ownerId: number;

  @IsString()
  @IsOptional()
  status: string; // حالة العرض (pending, accepted, rejected)
}
