import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreatePortfolioDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  @IsOptional()
  projectUrl: string;

  @IsString()
  @IsNotEmpty()
  imageUrl: string;
}
