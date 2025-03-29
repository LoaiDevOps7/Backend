import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { Message } from './message.entity';
import { NotificationModule } from '../notifications/notification.module';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '../users/users.module';
import { ProjectModule } from '../projects/projects.module';
import { ChatRoom } from './chat-room.entity';
import { Contract } from './contract.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, ChatRoom, Contract]),
    forwardRef(() => ProjectModule),
    UserModule,
    NotificationModule,
    JwtModule,
  ],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}
