import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Message } from '../chats/message.entity';
import { UseFilters } from '@nestjs/common';
import { AllWsExceptionsFilter } from '@/core/exceptions/all-ws-exceptions.filter';

@UseFilters(new AllWsExceptionsFilter())
@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST'],
  },
})
export class NotificationGateway {
  @WebSocketServer()
  server: Server;

  handleNotification(data: { userId: number; message: string }): void {
    const userIdString = data.userId.toString();
    this.server.to(userIdString).emit('notification', data.message);
  }

  // إرسال إشعار خاص لمستخدم معين
  handlePrivateNotification(userId: number, message: string): void {
    this.server.to(userId.toString()).emit('private-notification', {
      title: 'إشعار ',
      description: message,
      read: false,
    });
  }

  // إرسال إشعار عام لجميع العملاء
  handlePublicNotification(message: string): void {
    this.server.emit('public-notification', {
      title: 'إشعار عام',
      description: message,
      read: false,
    });
  }

  @SubscribeMessage('join-private')
  handleJoinPrivate(
    @MessageBody() userId: number,
    @ConnectedSocket() client: Socket,
  ): void {
    const userIdString = userId.toString();
    client.join(userIdString);
  }

  @SubscribeMessage('join-public')
  handleJoinPublic(@ConnectedSocket() client: Socket): void {
    client.join('public-room');
  }

  // دالة جديدة للتعامل مع الرسائل الواردة وإرسال إشعارات
  handleMessageNotification(data: {
    senderId: string;
    recipientId: string;
    message: string;
  }): void {
    this.server.to(data.recipientId).emit('newMessage', {
      senderId: data.senderId,
      message: data.message,
    });
  }

  async sendMessageNotification(
    senderId: string,
    recipientId: string,
    message: Message,
  ): Promise<void> {
    this.handleMessageNotification({
      senderId,
      recipientId,
      message: message.content,
    });
  }
}
