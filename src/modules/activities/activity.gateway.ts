import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ActivityService } from './activity.service';

@WebSocketGateway()
export class ActivityGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly activityService: ActivityService) {}

  handleConnection(client: Socket) {}

  handleDisconnect(client: Socket) {}

  @SubscribeMessage('heartbeat')
  async handleHeartbeat(@ConnectedSocket() client: Socket, userId: number) {
    try {
      // التحقق من وجود payload ومعرّف المستخدم
      if (!userId) {
        return;
      }

      // محاولة تحويل userId إلى رقم
      if (isNaN(userId)) {
        return;
      }

      // استخدام مفتاح ثابت للغرفة
      const roomKey = `user_${userId}`;
      client.join(roomKey);

      // تحديث نشاط المستخدم في قاعدة البيانات أو Redis
      await this.activityService.updateUserActivity(userId);
    } catch (error) {
      console.error('حدث خطأ في handleHeartbeat:', error);
    }
  }
}
