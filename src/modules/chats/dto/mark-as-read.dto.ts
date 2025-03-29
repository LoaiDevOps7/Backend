import { IsUUID } from 'class-validator';

export class MarkAsReadDto {
  @IsUUID()
  messageId: string;
}
