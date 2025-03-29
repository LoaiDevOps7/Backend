import { IsUUID } from 'class-validator';

export class TypingEventDto {
  @IsUUID()
  projectId: string;
}
