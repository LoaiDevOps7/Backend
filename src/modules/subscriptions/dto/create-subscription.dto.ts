import { IsInt, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateSubscriptionDto {
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @IsInt()
  @IsNotEmpty()
  packageId: string;

  @IsString()
  @IsOptional()
  status: string = 'active';

  @IsOptional()
  startDate: Date = new Date();

  @IsOptional()
  endDate: Date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // مدة اشتراك لمدة شهر
}
