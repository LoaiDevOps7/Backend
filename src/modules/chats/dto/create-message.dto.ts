import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
} from 'class-validator';

export class CreateMessageDto {
  @IsUUID()
  projectId: string;

  @IsNotEmpty()
  content: string;

  @IsNumber()
  receiverId: number;

  @IsOptional()
  @IsEnum(['text', 'offer', 'contract', 'payment', 'file'])
  type?: string;

  @IsOptional()
  attachmentUrl?: string;
}
