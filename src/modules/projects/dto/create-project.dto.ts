import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsEnum,
  IsNumber,
  IsPositive,
  IsArray,
} from 'class-validator';

export enum ProjectStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  TESTING = 'testing',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  @IsArray()
  skills: string;

  // تاريخ الانتهاء أو الموعد النهائي لإنجاز المشروع،
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  duration: number;

  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @IsUUID()
  @IsNotEmpty()
  ownerId: number;

  @IsEnum(ProjectStatus)
  @IsNotEmpty()
  status: ProjectStatus;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  budget: number;
}
