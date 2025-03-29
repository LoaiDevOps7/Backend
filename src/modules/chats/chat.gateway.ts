import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { UseFilters, UseGuards } from '@nestjs/common';
import { JwtWsGuard } from '@/core/guards/ws-jwt.guard';
import { CreateMessageDto } from './dto/create-message.dto';
import { AllWsExceptionsFilter } from '@/core/exceptions/all-ws-exceptions.filter';

@UseFilters(new AllWsExceptionsFilter())
@WebSocketGateway({
  cors: {
    origin: '*',
    allowedHeaders: ['Authorization', 'Content-Type'],
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  afterInit(server: Server) {
    this.chatService.server = server;
  }

  constructor(private readonly chatService: ChatService) {}

  async handleConnection(@ConnectedSocket() client: Socket) {
    console.log('New client connected:', client.id);
    await this.chatService.handleConnection(client);
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    console.log('Client disconnected:', client.id);
    await this.chatService.handleDisconnect(client);
  }

  @UseGuards(JwtWsGuard)
  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: CreateMessageDto,
  ) {
    // إرسال الرسالة إلى الخدمة لمعالجتها وتخزينها في قاعدة البيانات
    return this.chatService.handleMessage(client, payload);
  }

  // محادثة تعريفية (تعريف الأطراف والتعريف بالمشروع)
  @UseGuards(JwtWsGuard)
  @SubscribeMessage('join_introduction_chat')
  async joinIntroductionChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() projectId: string,
  ) {
    console.log('Joining introduction chat:', projectId);
    return this.chatService.joinIntroductionChat(client, projectId);
  }

  // محادثة معد التفاوض (التفاوض على التفاصيل والعروض)
  @UseGuards(JwtWsGuard)
  @SubscribeMessage('join_negotiation_chat')
  async joinOfferChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() projectId: string,
  ) {
    console.log('Joining offer chat:', projectId);
    return this.chatService.joinNegotiationChat(client, projectId);
  }

  // محادثة كتابة العقد (صياغة العقد والشروط القانونية)
  @UseGuards(JwtWsGuard)
  @SubscribeMessage('join_contract_chat')
  async joinContractChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() projectId: string,
  ) {
    console.log('Joining contract chat:', projectId);
    console.log('Received projectId:', projectId);
    return this.chatService.joinContractChat(client, projectId);
  }

  // محادثة المشروع العامة
  @UseGuards(JwtWsGuard)
  @SubscribeMessage('join_project_chat')
  async joinProjectChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
  ) {
    console.log('Joining project chat:', data);
    return this.chatService.joinProjectChat(client, data.projectId);
  }

  // @UseGuards(JwtWsGuard)
  // @SubscribeMessage('advance_stage')
  // async handleAdvanceStage(
  //   @ConnectedSocket() client: Socket,
  //   @MessageBody() projectId: string,
  // ) {
  //   return this.chatService.advanceProjectStage(client, projectId);
  // }

  @UseGuards(JwtWsGuard)
  @SubscribeMessage('leave_project_chat')
  async leaveProjectChat(@ConnectedSocket() client: Socket, projectId: string) {
    // مغادرة غرفة المشروع
    return this.chatService.leaveProjectChat(client, projectId);
  }

  @UseGuards(JwtWsGuard)
  @SubscribeMessage('user_typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    payload: { projectId: string },
  ) {
    // إعلام باقي أعضاء الغرفة بأن المستخدم يكتب رسالة
    return this.chatService.handleTyping(client, payload.projectId);
  }

  @UseGuards(JwtWsGuard)
  @SubscribeMessage('mark_as_read')
  async markAsRead(
    @ConnectedSocket() client: Socket,
    payload: { messageId: string },
  ) {
    // تعليم الرسالة على أنها مقروءة
    return this.chatService.markMessageAsRead(payload.messageId);
  }

  @UseGuards(JwtWsGuard)
  @SubscribeMessage('get_chat_history')
  async getChatHistory(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      projectId: string;
      roomType: string;
      limit?: number;
      offset?: number;
    },
  ) {
    // استرجاع سجل المحادثات مع إمكانية التحديد (pagination)
    return this.chatService.getChatHistory(
      client,
      payload.projectId,
      payload.roomType,
      payload.limit,
      payload.offset,
    );
  }

  @UseGuards(JwtWsGuard)
  @SubscribeMessage('get_available_rooms')
  async handleGetRooms(@ConnectedSocket() client: Socket) {
    const user = await this.chatService.validateUserFromSocket(client);
    const rooms = await this.chatService.getAvailableRooms(user.id);
    console.log(
      'Allowed Rooms:',
      rooms.map((room) => ({
        id: room.id,
        allowedUsers: room.allowedUsers.map((u) => u.id),
      })),
    );
    client.emit('available_rooms', rooms);
  }

  @UseGuards(JwtWsGuard)
  @SubscribeMessage('update_message')
  async updateMessage(
    @ConnectedSocket() client: Socket,
    payload: { messageId: string; newText: string },
  ) {
    // تعديل نص الرسالة المحددة
    return this.chatService.updateMessage(
      client,
      payload.messageId,
      payload.newText,
    );
  }

  @UseGuards(JwtWsGuard)
  @SubscribeMessage('delete_message')
  async deleteMessage(
    @ConnectedSocket() client: Socket,
    payload: { messageId: string },
  ) {
    // حذف الرسالة المحددة
    return this.chatService.deleteMessage(client, payload.messageId);
  }

  @UseGuards(JwtWsGuard)
  @SubscribeMessage('send_file')
  async sendFile(
    @ConnectedSocket() client: Socket,
    payload: { projectId: string; fileUrl: string; fileType: string },
  ) {
    // إرسال ملف (صورة، وثيقة...) إلى غرفة المشروع
    return this.chatService.sendFile(client, payload);
  }

  @UseGuards(JwtWsGuard)
  @SubscribeMessage('react_message')
  async reactMessage(
    @ConnectedSocket() client: Socket,
    payload: { messageId: string; reaction: string },
  ) {
    // إضافة تفاعل (emoji أو رد فعل) على رسالة معينة
    return this.chatService.reactMessage(
      client,
      payload.messageId,
      payload.reaction,
    );
  }
}
