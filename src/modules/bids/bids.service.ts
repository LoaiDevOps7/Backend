import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BidRepository } from '@/infrastructure/repositories/bid.repository';
import { Bid } from './bids.entity';
import { CreateBidDto } from './dto/create-bid.dto';
import { ProjectService } from '../projects/projects.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class BidService {
  constructor(
    private readonly bidRepository: BidRepository,
    private readonly projectService: ProjectService,
    private readonly userService: UsersService,
  ) {}

  // إنشاء عرض مع التحقق من الحد الأقصى للتقديم
  async createBid(createBidDto: CreateBidDto): Promise<Bid> {
    const freelancer = await this.userService.findByIdWithSubscriptions(
      createBidDto.freelancerId,
    );
    if (!freelancer) throw new NotFoundException('المستخدم غير موجود');

    const owner = await this.userService.findById(createBidDto.ownerId);
    if (!owner) throw new NotFoundException('المالك غير موجود');

    const project = await this.projectService.findOne(createBidDto.projectId);
    if (!project) throw new NotFoundException('المشروع غير موجود');

    // التحقق من حالة المشروع إذا كانت "pending"
    if (project.status !== 'pending') {
      throw new BadRequestException(
        'المشروع غير مفعل ولا يمكن تقديم عروض عليه.',
      );
    }

    // التحقق إذا كان المستخدم قد قدم عرضاً بالفعل لهذا المشروع
    const existingBid = await this.bidRepository.findOne({
      where: {
        freelancer: { id: freelancer.id },
        project: { id: project.id },
      },
    });

    if (existingBid) {
      throw new BadRequestException('لقد قمت بالفعل بتقديم عرض لهذا المشروع.');
    }

    const today = new Date().toISOString().split('T')[0]; // تاريخ اليوم فقط

    const activeSubscription = freelancer.subscriptions?.find((sub) => {
      const now = new Date();
      return (
        sub.status === 'active' &&
        new Date(sub.startDate) <= now &&
        new Date(sub.endDate) >= now
      );
    });

    let maxBidsPerDay = 5; // الافتراضي
    if (activeSubscription && activeSubscription.package.features) {
      const features = activeSubscription.package.features as any;
      if (features.maxBidsPerDay) {
        maxBidsPerDay = features.maxBidsPerDay;
      }
    }

    // إعادة تعيين عدد التقديمات إذا تغير اليوم
    if (freelancer.lastBidReset !== today) {
      freelancer.remainingBids = maxBidsPerDay;
      freelancer.lastBidReset = today;
      await this.userService.updateUser(freelancer.id, {
        remainingBids: freelancer.remainingBids,
        lastBidReset: today,
      });
    }

    // التحقق من وجود تقديمات متاحة
    if (freelancer.remainingBids <= 0) {
      throw new BadRequestException(
        'لقد استنفدت عدد التقديمات اليومية. يرجى المحاولة غدًا.',
      );
    }

    // خصم تقديم واحد
    freelancer.remainingBids -= 1;
    await this.userService.updateUser(freelancer.id, {
      remainingBids: freelancer.remainingBids,
    });

    // إنشاء العرض وحفظه
    const bid = this.bidRepository.create({
      ...createBidDto,
      freelancer,
      project,
      owner,
    });
    return await this.bidRepository.save(bid);
  }

  // الحصول على العروض بناءً على المشروع
  async findByProject(projectId: string): Promise<Bid[]> {
    return this.bidRepository.findByProjectId(projectId);
  }

  // الحصول على العروض بناءً على المستقل
  async findByFreelancer(freelancerId: number): Promise<Bid[]> {
    return this.bidRepository.findByFreelancerId(freelancerId);
  }
}
