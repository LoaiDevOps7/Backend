import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateThemeDto {
  @IsString()
  name: string;

  @IsString()
  primaryColor: string;

  @IsString()
  secondaryColor: string;

  @IsString()
  backgroundColor: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  homeIcon?: string;

  @IsString()
  @IsOptional()
  profileIcon?: string;

  @IsString()
  @IsOptional()
  settingsIcon?: string;
}
