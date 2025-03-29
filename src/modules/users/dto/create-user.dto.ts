import {
  ArrayNotEmpty,
  IsArray,
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsArray()
  @ArrayNotEmpty()
  roles: string[] = ['RegularUser'];

  @IsString()
  verificationCode: string;

  @IsDate()
  verificationCodeExpiry: Date;
}
