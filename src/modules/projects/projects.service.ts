import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ProjectRepository } from '@/infrastructure/repositories/project.repository';
import { BidRepository } from '@/infrastructure/repositories/bid.repository';
import { CategoryRepository } from '@/infrastructure/repositories/category.repository';
import { Project } from './projects.entity';
import { CreateProjectDto, ProjectStatus } from './dto/create-project.dto';
import { WalletService } from '../wallets/wallets.service';
import { UsersService } from '../users/users.service';
import { NotificationService } from '../notifications/notification.service';
import { NotificationChannel } from '../notifications/types/notification.types';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contract } from '../chats/contract.entity';
// import { ChatService } from '../chats/chat.service';

@Injectable()
export class ProjectService {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly bidRepository: BidRepository,
    private readonly walletService: WalletService,
    private readonly categoryRepository: CategoryRepository,
    private readonly userService: UsersService,
    private readonly notificationService: NotificationService,
    // private readonly chatService: ChatService,
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
  ) {}

  // إنشاء المشروع
  async createProject(createProjectDto: CreateProjectDto): Promise<Project> {
    const user = await this.userService.findById(createProjectDto.ownerId);

    if (!user) {
      throw new Error('المستخدم غير موجود');
    }

    if (!user.hasRole('Owner')) {
      throw new Error('المستخدم لا يملك صلاحيات لإنشاء مشروع');
    }

    const category = await this.categoryRepository.findOne({
      where: { id: createProjectDto.categoryId },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    const project = this.projectRepository.create({
      ...createProjectDto,
      status: ProjectStatus.PENDING,
      category,
      owner: user,
    });

    return this.projectRepository.save(project);
  }

  async updateProjectStatus(
    projectId: string,
    status: string,
  ): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const allowedStatuses = Object.values(ProjectStatus) as string[];

    if (!allowedStatuses.includes(status)) {
      throw new Error('Invalid status');
    }

    project.status = status as ProjectStatus;
    return this.projectRepository.save(project);
  }

  // الحصول على المشاريع حسب الفئة
  async findByCategory(categoryId: string): Promise<Project[]> {
    return this.projectRepository.findByCategory(categoryId);
  }

  // الحصول على المشاريع حسب المالك
  async findByOwner(ownerId: number): Promise<Project[]> {
    return this.projectRepository.findByOwner(ownerId);
  }

  async getProjectById(projectId: string): Promise<Project> {
    console.log('Searching for project ID:', projectId);
    return this.projectRepository.findOne({
      where: { id: projectId },
      relations: [
        'owner',
        'bids',
        'bids.freelancer',
        'chatRooms',
        'contract',
        // 'contract.signatures',
      ],
    });
  }

  // async updateProjectStage(projectId: string, newStage: string) {
  //   const project = await this.getProjectById(projectId);
  //   project.currentStage = newStage;

  //   // إغلاق العقود السابقة عند التقدم
  //   if (newStage === 'execution') {
  //     await this.chatService.closeContractRoom(projectId);
  //   }

  //   return this.projectRepository.save(project);
  // }

  async advanceProjectStage(projectId: string, userId: number) {
    const project = await this.getProjectById(projectId);

    if (project.owner.id !== userId) {
      throw new ForbiddenException('Only owner can advance project stage');
    }

    const nextStageMap = {
      introduction: 'negotiation',
      negotiation: 'contract',
      contract: 'execution',
      execution: null,
    };

    const nextStage = nextStageMap[project.status];
    if (!nextStage) throw new BadRequestException('Invalid stage transition');

    if (nextStage === 'contract' && !project.contract) {
      const contract = this.contractRepository.create({
        content: 'Default contract content',
        project,
      });
      await this.contractRepository.save(contract);
      project.contract = contract;
    }

    project.status = nextStage;
    await this.projectRepository.save(project);

    return project;
  }

  // الحصول على جميع المشاريع
  async findAll(): Promise<Project[]> {
    return this.projectRepository.findAllProjects();
  }

  async findOne(projectId: string): Promise<Project> {
    return this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['owner', 'bids', 'owner.personalInfo', 'category'],
    });
  }

  // رفض العرض
  async rejectBid(projectId: string, bidId: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['bids'],
    });
    const bid = await this.bidRepository.findOne({ where: { id: bidId } });

    if (!project || !bid) {
      throw new Error('Project or Bid not found');
    }

    // تحديث حالة العرض إلى rejected
    bid.status = 'rejected';
    await this.bidRepository.save(bid);

    return project;
  }

  // قبول عرض لمشروع
  async acceptBid(projectId: string, bidId: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['bids'],
    });
    const bid = await this.bidRepository.findOne({
      where: { id: bidId },
      relations: ['owner'],
    });

    if (!project || !bid) {
      throw new Error('Project or Bid not found');
    }

    if (project.status !== ProjectStatus.PENDING) {
      throw new Error('Project is not active');
    }

    const now = new Date();
    // نفترض أن مدة المشروع محفوظة في المشروع (duration)
    const duration = project.duration;
    if (!duration) {
      throw new BadRequestException('Duration is not set for the project');
    }
    const end = new Date(now);
    end.setDate(now.getDate() + duration);

    // قبول العرض
    project.startDate = now;
    project.endDate = end;
    project.status = ProjectStatus.IN_PROGRESS;
    project.selectedBid = bid; // تعيين العرض المقبول للمشروع
    bid.status = 'accepted';
    await this.projectRepository.save(project);
    await this.bidRepository.save(bid);

    // تحويل المبلغ إلى حساب الموقع مع خصم نسبة الموقع
    const adminId = 3;
    await this.walletService.transferToSiteAccount(
      adminId,
      bid.amount,
      bid.currency,
    );

    await this.notificationService.sendNotification(
      'bid-accepted-freelancer',
      bid.freelancer.email,
      {
        projectName: project.name,
        freelancerFirstName: bid.freelancer.personalInfo.firstName,
        freelancerLastName: bid.freelancer.personalInfo.lastName,
      },
      [NotificationChannel.EMAIL],
    );

    return project;
  }

  // نقل المشروع إلى مرحلة الاختبار مع تنفيذ منطق الحساب المؤقت (Escrow)
  async sendProjectToTesting(projectId: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['selectedBid'],
    });

    if (!project) {
      throw new Error('Project not found');
    }

    if (project.status !== ProjectStatus.IN_PROGRESS) {
      throw new Error('Project is not in progress');
    }

    // تغيير حالة المشروع إلى TESTING
    project.status = ProjectStatus.TESTING;
    await this.projectRepository.save(project);

    const bid = project.selectedBid;
    if (!bid) {
      throw new Error('No accepted bid found');
    }

    // منطق الدفع الجزئي: الإفراج عن نسبة من المبلغ إلى الفريلانسر واحتجاز الباقي حتى التأكيد النهائي.
    const releasePercentage = 0.7; // نسبة 70% تُدفع مباشرةً للفريلانسر
    const escrowPercentage = 0.3; // نسبة 30% تُحتجز في حساب الموقع (أو حساب مؤقت)
    const partialAmount = bid.amount * releasePercentage;
    const escrowAmount = bid.amount * escrowPercentage;

    // تحويل الجزء الجزئي إلى الفريلانسر
    await this.walletService.transferToFreelancer(
      bid.freelancer.id,
      partialAmount,
      bid.currency,
    );

    // احتجاز المبلغ المتبقي حتى التأكيد النهائي (نفترض وجود دالة holdFundsInEscrow)
    await this.walletService.holdFundsInEscrow(
      bid.freelancer.id,
      escrowAmount,
      bid.currency,
    );

    // إرسال إشعار للفريلانسر بإعلامه بعملية الدفع الجزئي والاحتجاز المؤقت
    await this.notificationService.sendNotification(
      'project-testing-payment',
      bid.freelancer.email,
      {
        projectName: project.name,
        releasedAmount: partialAmount,
        escrowAmount: escrowAmount,
      },
      [NotificationChannel.EMAIL],
    );

    return project;
  }

  // إتمام المشروع
  async completeProject(projectId: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['selectedBid'],
    });

    if (!project) {
      throw new Error('Project not found');
    }

    if (project.status !== ProjectStatus.IN_PROGRESS) {
      throw new Error('Project is not in progress');
    }

    project.status = ProjectStatus.COMPLETED; // تحديث حالة المشروع إلى "مكتمل"
    await this.projectRepository.save(project);

    // بعد إتمام المشروع، تحويل المبلغ المتبقي إلى الفريلانسر
    const bid = project.selectedBid;
    if (!bid) {
      throw new Error('No accepted bid found');
    }

    const feePercentage = 0.1; // 10% من المبلغ يذهب للموقع
    const amountAfterFee = bid.amount - bid.amount * feePercentage;

    await this.walletService.transferToFreelancer(
      bid.freelancer.id,
      amountAfterFee,
      bid.currency,
    );

    return project;
  }
}
