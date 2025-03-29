import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './message.entity';
import { ChatRoom } from './chat-room.entity';
import { User } from '@/modules/users/users.entity';
import { ProjectService } from '@/modules/projects/projects.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Socket, Server } from 'socket.io';
import { Project } from '../projects/projects.entity';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '@/infrastructure/repositories/user.repository';
import { UsersService } from '../users/users.service';

@Injectable()
export class ChatService {
  public server: Server;
  private activeClients = new Map<string, Socket>();
  private typingUsers = new Map<string, NodeJS.Timeout>();

  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(ChatRoom)
    private chatRoomRepository: Repository<ChatRoom>,
    private readonly userRepository: UserRepository,
    private readonly userService: UsersService,
    private projectService: ProjectService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    const user = await this.authenticateClient(client);
    if (!user) {
      // client.disconnect();
      return;
    }

    const userId = String(user.id);
    this.activeClients.set(userId, client);
    await this.userRepository.update(user.id, { isOnline: true });

    client.join(`user_${userId}`);
    this.broadcastPresence(userId, true);
  }

  async handleDisconnect(client: Socket) {
    const user = await this.getUserFromSocket(client);
    if (user) {
      const userId = String(user.id);
      this.activeClients.delete(userId);
      await this.userRepository.update(user.id, { isOnline: false });
      this.broadcastPresence(userId, false);
    }
  }

  async handleMessage(client: Socket, payload: CreateMessageDto) {
    const user = await this.getUserFromSocket(client);
    if (!user) throw new ForbiddenException('Unauthorized');
    const receiver = await this.userService.findById(payload.receiverId);
    if (!receiver) {
      throw new NotFoundException('Receiver not found');
    }
    console.log('Received payload:', payload);

    const project = await this.projectService.getProjectById(payload.projectId);
    console.log('Received project:', project);
    if (!project || !this.canSendMessage(user.id, project)) {
      throw new ForbiddenException('Not allowed to send message');
    }

    // يتم استخدام معرف المشروع في اسم الغرفة لضمان الاتساق
    const room = await this.getOrCreateChatRoom(project.id, user.id);
    const message = this.messageRepository.create({
      content: payload.content,
      sender: user,
      receiver,
      room,
      status: 'sent',
    });

    const savedMessage = await this.messageRepository.save(message);
    // إرسال الرسالة باستخدام معرف المشروع كجزء من اسم الغرفة
    this.sendToRoom(project.id, 'new_message', savedMessage);
    this.updateMessageStatus(savedMessage.id, 'delivered');

    return savedMessage;
  }

  async joinProjectChat(client: Socket, projectId: string) {
    const user = await this.getUserFromSocket(client);
    if (!user) throw new ForbiddenException('Unauthorized');
    console.log(user);

    const project = await this.projectService.getProjectById(projectId);
    console.log(project);
    if (project && this.canJoinChat(user.id, project)) {
      // فقط المالك ينشئ الغرفة إذا لم تكن موجودة
      if (project.owner.id === user.id) {
        await this.getOrCreateChatRoom(projectId, user.id); // الإنشاء هنا للمالك فقط
      }

      // التحقق من وجود الغرفة قبل الانضمام (للمستخدمين الآخرين)
      const roomExists = await this.chatRoomRepository.exist({
        where: { project: { id: projectId } },
        relations: ['project'],
      });

      if (!roomExists) {
        throw new ForbiddenException('Chat room not created yet');
      }

      client.join(`project_${projectId}`);
      await this.sendChatHistory(client, projectId);
    } else {
      throw new ForbiddenException('Not allowed to join this chat');
    }
  }

  // الانضمام إلى غرفة الدردشة التعريفية
  async joinIntroductionChat(client: Socket, projectId: string) {
    const user = await this.getUserFromSocket(client);
    if (!user) throw new ForbiddenException('Unauthorized');

    const project = await this.projectService.getProjectById(projectId);
    if (project && this.canJoinChat(user.id, project)) {
      const roomName = `project_${projectId}_introduction`;
      client.join(roomName);
      await this.sendChatHistoryForRoom(client, projectId, 'introduction');
      return { status: 'joined', room: roomName };
    } else {
      throw new ForbiddenException('Not allowed to join this chat');
    }
  }

  // الانضمام إلى غرفة دردشة التفاوض (العروض)
  async joinNegotiationChat(client: Socket, projectId: string) {
    const user = await this.getUserFromSocket(client);
    if (!user) throw new ForbiddenException('Unauthorized');

    const project = await this.projectService.getProjectById(projectId);
    if (project && this.canJoinChat(user.id, project)) {
      const roomName = `project_${projectId}negotiation`;
      client.join(roomName);
      await this.sendChatHistoryForRoom(client, projectId, 'negotiation');
      return { status: 'joined', room: roomName };
    } else {
      throw new ForbiddenException('Not allowed to join this chat');
    }
  }

  // الانضمام إلى غرفة دردشة كتابة العقد
  async joinContractChat(client: Socket, projectId: string) {
    const user = await this.getUserFromSocket(client);
    if (!user) throw new ForbiddenException('Unauthorized');

    const project = await this.projectService.getProjectById(projectId);
    if (project && this.canJoinChat(user.id, project)) {
      const roomName = `project_${projectId}_contract`;
      client.join(roomName);
      await this.sendChatHistoryForRoom(client, projectId, 'contract');
      return { status: 'joined', room: roomName };
    } else {
      throw new ForbiddenException('Not allowed to join this chat');
    }
  }

  async leaveProjectChat(client: Socket, projectId: string) {
    const user = await this.getUserFromSocket(client);
    if (user) {
      client.leave(`project_${projectId}`);
      this.server.to(`project_${projectId}`).emit('user_left', {
        userId: user.id,
        username: user.username,
      });
    }
  }

  async handleTyping(client: Socket, projectId: string) {
    const user = await this.getUserFromSocket(client);
    if (user) {
      const userId = String(user.id);
      client.to(`project_${projectId}`).emit('typing', {
        userId,
        isTyping: true,
      });
      this.resetTypingIndicator(userId, projectId);
    }
  }

  async markMessageAsRead(messageId: string) {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['sender', 'room'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    await this.messageRepository.update(messageId, { status: 'read' });
    this.server.to(`user_${message.sender.id}`).emit('message_read', {
      messageId,
      chatRoomId: message.room.id,
    });

    return message;
  }

  // الدالة الجديدة لاسترجاع سجل الدردشة مع دعم التجزئة (pagination)
  async getChatHistory(
    client: Socket,
    projectId: string,
    roomType: string,
    limit?: number,
    offset?: number,
  ) {
    const room = await this.chatRoomRepository.findOne({
      where: { project: { id: projectId }, type: roomType },
      relations: ['messages', 'messages.sender'],
      order: { messages: { timestamp: 'DESC' } },
    });
    if (!room) {
      throw new NotFoundException('Chat room not found');
    }
    const messages = room.messages.slice(
      offset || 0,
      (offset || 0) + (limit || room.messages.length),
    );
    return { projectId, messages };
  }

  // الدالة الجديدة لتعديل الرسائل
  async updateMessage(client: Socket, messageId: string, newText: string) {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['sender', 'room', 'room.project'],
    });
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    const user = await this.getUserFromSocket(client);
    if (message.sender.id !== user.id) {
      throw new ForbiddenException('You are not allowed to edit this message');
    }
    message.content = newText;
    const updatedMessage = await this.messageRepository.save(message);
    this.server
      .to(`project_${message.room.project.id}`)
      .emit('message_updated', updatedMessage);
    return updatedMessage;
  }

  // الدالة الجديدة لحذف الرسائل
  async deleteMessage(client: Socket, messageId: string) {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['sender', 'room', 'room.project'],
    });
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    const user = await this.getUserFromSocket(client);
    if (message.sender.id !== user.id) {
      throw new ForbiddenException(
        'You are not allowed to delete this message',
      );
    }
    await this.messageRepository.delete(messageId);
    this.server
      .to(`project_${message.room.project.id}`)
      .emit('message_deleted', { messageId });
    return { message: 'Message deleted successfully' };
  }

  // الدالة الجديدة لإرسال الملفات
  async sendFile(
    client: Socket,
    payload: { projectId: string; fileUrl: string; fileType: string },
  ) {
    const user = await this.getUserFromSocket(client);
    if (!user) {
      throw new ForbiddenException('Unauthorized');
    }
    const project = await this.projectService.findOne(payload.projectId);
    if (!project || !this.canSendMessage(user.id, project)) {
      throw new ForbiddenException('Not allowed to send file');
    }
    const room = await this.getOrCreateChatRoom(project.id, user.id);
    const fileMessage = this.messageRepository.create({
      content: '', // نص الرسالة فارغ عند إرسال ملف
      room,
      sender: user,
      attachmentUrl: payload.fileUrl,
      fileType: payload.fileType,
      type: 'file',
      status: 'sent',
    });
    const savedMessage = await this.messageRepository.save(fileMessage);
    this.sendToRoom(String(project.id), 'new_file', savedMessage);
    this.updateMessageStatus(savedMessage.id, 'delivered');
    return savedMessage;
  }

  // الدالة الجديدة لإضافة تفاعل على الرسائل
  async reactMessage(client: Socket, messageId: string, reaction: string) {
    const user = await this.getUserFromSocket(client);
    if (!user) {
      throw new ForbiddenException('Unauthorized');
    }
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['room', 'room.project'],
    });
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    if (!message.reactions) {
      message.reactions = [];
    }
    message.reactions.push({ userId: user.id, reaction });
    const updatedMessage = await this.messageRepository.save(message);
    this.sendToRoom(
      String(message.room.project.id),
      'message_reacted',
      updatedMessage,
    );
    return updatedMessage;
  }

  // async createContractRoom(projectId: string, freelancerId: number) {
  //   const project = await this.projectService.getProjectById(projectId);
  //   const room = this.chatRoomRepository.create({
  //     type: 'contract',
  //     project,
  //     allowedUsers: [project.owner, freelancerId],
  //   });
  //   return this.chatRoomRepository.save(room);
  // }

  async closeIntroductionRoom(projectId: string) {
    await this.chatRoomRepository.update(
      { project: { id: projectId }, type: 'introduction' },
      { status: 'closed' },
    );
  }

  async getAvailableRooms(
    // projectId: string,/
    userId: number,
  ): Promise<ChatRoom[]> {
    // const project = await this.projectService.getProjectById(projectId);
    const rooms = await this.chatRoomRepository.find({
      where: { allowedUsers: { id: userId } },
      relations: ['project', 'messages', 'allowedUsers'],
    });

    // console.log('Project Owner ID:', project.owner.id);
    console.log('Current User ID:', userId);

    console.log('Joining rooms chat:', rooms);

    return rooms;
  }

  async initializeProjectChat(projectId: string) {
    const project = await this.projectService.getProjectById(projectId);
    const existingRooms = await this.chatRoomRepository.find({
      where: { project: { id: projectId } },
    });

    // إنشاء الغرف الأساسية إذا لم تكن موجودة
    if (!existingRooms.length) {
      const rooms = [
        { type: 'introduction', allowedUsers: [project.owner] },
        { type: 'negotiation', allowedUsers: [] },
        { type: 'contract', allowedUsers: [] },
        { type: 'execution', allowedUsers: [] },
      ];

      for (const roomData of rooms) {
        const room = this.chatRoomRepository.create({
          ...roomData,
          project,
          status: roomData.type === 'introduction' ? 'active' : 'locked',
        });
        await this.chatRoomRepository.save(room);
      }
    }
  }

  // async advanceProjectStage(client: Socket, projectId: string) {
  //   const user = await this.validateUserFromSocket(client);
  //   const project = await this.projectService.getProjectById(projectId);

  //   if (project.owner.id !== user.id) {
  //     throw new ForbiddenException('Only owner can advance stages');
  //   }

  //   const nextStage = this.getNextStage(project.currentStage);
  //   await this.projectService.updateProjectStage(projectId, nextStage);

  //   // قفل الغرفة السابقة وفتح الجديدة
  //   await this.chatRoomRepository.update(
  //     { project: { id: projectId }, type: project.currentStage },
  //     { status: 'closed' },
  //   );

  //   await this.chatRoomRepository.update(
  //     { project: { id: projectId }, type: nextStage },
  //     { status: 'active' },
  //   );

  //   this.server.to(`project_${projectId}`).emit('stage_advanced', {
  //     newStage: nextStage,
  //     activeRoom: `project_${projectId}_${nextStage}`,
  //   });
  // }

  // async joinStageRoom(client: Socket, projectId: string) {
  //   const user = await this.validateUserFromSocket(client);
  //   const project = await this.projectService.getProjectById(projectId);
  //   const roomType = project.currentStage;

  //   if (!this.checkStageAccess(user, project)) {
  //     throw new ForbiddenException('Access denied for current stage');
  //   }

  //   const roomName = `project_${projectId}_${roomType}`;
  //   client.join(roomName);
  //   return this.sendChatHistoryForRoom(client, projectId, roomType);
  // }

  // private checkStageAccess(user: User, project: Project): boolean {
  //   const room = project.chatRooms.find((r) => r.type === project.currentStage);

  //   // المالك دائمًا مسموح
  //   if (project.owner.id === user.id) return true;

  //   // التحقق من الصلاحيات بناءً على المرحلة
  //   switch (project.currentStage) {
  //     case 'introduction':
  //       return true; // الجميع مسموح
  //     case 'negotiation':
  //       return project.bids.some(
  //         (b) => b.freelancer.id === user.id && b.status === 'accepted',
  //       );
  //     case 'contract':
  //       return project.contract.signatures.freelancer === user.id;
  //     case 'execution':
  //       return project.teamMembers.some((m) => m.id === user.id);
  //     default:
  //       return false;
  //   }
  // }

  private getNextStage(currentStage: string): string {
    const stages = ['introduction', 'negotiation', 'contract', 'execution'];
    const currentIndex = stages.indexOf(currentStage);
    return stages[currentIndex + 1] || currentStage;
  }

  // دالة إرسال سجل الدردشة للعميل لغرفة معينة
  private async sendChatHistoryForRoom(
    client: Socket,
    projectId: string,
    roomType: string,
  ) {
    const history = await this.getChatHistory(
      client,
      projectId,
      roomType,
      undefined,
      undefined,
    );
    client.emit('chat_history', history);
  }

  public async validateUserFromSocket(client: Socket): Promise<User> {
    const user = await this.getUserFromSocket(client);
    if (!user) throw new ForbiddenException('Unauthorized');
    return user;
  }

  private async getUserFromSocket(client: Socket): Promise<User | null> {
    try {
      const token = client.handshake.headers.authorization?.split(' ')[1];
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });
      return this.userService.findOnId(payload.sub);
    } catch (error) {
      console.error('JWT Verification Error:', error);
    }
  }

  private broadcastPresence(userId: string, isOnline: boolean) {
    this.server.emit('presence_update', {
      userId,
      status: isOnline ? 'online' : 'offline',
    });
  }

  private async sendChatHistory(client: Socket, projectId: string) {
    const room = await this.chatRoomRepository.findOne({
      where: { project: { id: projectId } },
      relations: ['messages', 'messages.sender'],
    });

    if (room) {
      client.emit('chat_history', {
        projectId,
        messages: room.messages,
      });
    }
  }

  private resetTypingIndicator(userId: string, projectId: string) {
    if (this.typingUsers.has(userId)) {
      clearTimeout(this.typingUsers.get(userId));
    }

    const timeout = setTimeout(() => {
      this.server.to(`project_${projectId}`).emit('typing', {
        userId,
        isTyping: false,
      });
    }, 2000);

    this.typingUsers.set(userId, timeout);
  }

  private async getOrCreateChatRoom(
    projectId: string,
    userId: number,
  ): Promise<ChatRoom> {
    const user = await this.userRepository.findOneBy({ id: userId });
    let room = await this.chatRoomRepository.findOne({
      where: { project: { id: projectId } },
      relations: ['project'],
    });

    if (!room) {
      const project = await this.projectService.getProjectById(projectId);
      if (project?.owner?.id !== userId) {
        throw new ForbiddenException('Only owner can create chat room');
      }
      room = this.chatRoomRepository.create({ project, allowedUsers: [user] });
      await this.chatRoomRepository.save(room);
    }

    return room;
  }

  private async authenticateClient(client: Socket): Promise<User | null> {
    try {
      const authHeader = client.handshake.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
      }

      const token = authHeader.split(' ')[1];
      const payload = this.jwtService.verify(token);

      if (!payload?.sub) {
        return null;
      }

      const user = await this.userRepository.findOneBy({ id: payload.sub });
      if (!user) {
        return null;
      }

      return user;
    } catch {
      return null;
    }
  }

  private canSendMessage(userId: number, project: Project): boolean {
    const ownerId = project.owner.id.toString();
    const userIdStr = userId.toString();

    if (ownerId === userIdStr) return true;

    switch (project.currentStage) {
      case 'introduction':
        return true; // الجميع مسموح في مرحلة التعريف

      case 'negotiation':
        // المستقلون المقبولون فقط
        return (
          project.bids?.some(
            (b) => b.freelancer?.id === userId && b.status === 'accepted',
          ) ?? false
        );

      case 'contract':
      case 'execution':
        return project.contract?.signatures?.freelancer !== null;

      default:
        return false;
    }
  }

  private sendToRoom(projectId: string, event: string, payload: any) {
    if (!this.server) {
      throw new Error('WebSocket server is not initialized');
    }
    this.server.to(`project_${projectId}`).emit(event, payload);
    this.server.to(`user_${payload.receiver.id}`).emit(event, payload);
  }

  private async updateMessageStatus(
    messageId: string,
    status: 'delivered' | 'read',
  ) {
    await this.messageRepository.update(messageId, { status });
  }

  private canJoinChat(userId: number, project: Project): boolean {
    return (
      project.owner.id === userId ||
      project.bids.some((b) => b.freelancer?.id === userId)
    );
  }
}
