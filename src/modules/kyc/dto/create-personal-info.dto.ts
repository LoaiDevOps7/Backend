import { IsString, IsDate, IsNotEmpty, IsOptional } from 'class-validator';

export class CreatePersonalInfoDto {
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsDate()
  dateOfBirth: Date;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  profileImage: string;

  @IsNotEmpty()
  @IsString()
  jobName: string;

  @IsString()
  @IsOptional()
  skills: string[];

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsNotEmpty()
  @IsString()
  country: string;
}
