import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Bid } from '@/modules/bids/bids.entity';

@Injectable()
export class BidRepository extends Repository<Bid> {
  constructor(private dataSource: DataSource) {
    super(Bid, dataSource.createEntityManager());
  }

  // // وظيفة لإنشاء عرض
  // async createBid(bidData: Partial<Bid>): Promise<Bid> {
  //   const bid = this.create(bidData);
  //   try {
  //     return await this.save(bid);
  //   } catch {
  //     throw new Error('Failed to create bid');
  //   }
  // }

  // وظيفة للبحث عن عروض مرتبطة بمشروع معين
  async findByProjectId(projectId: string): Promise<Bid[]> {
    return this.find({
      where: { project: { id: projectId } },
      relations: ['project', 'freelancer.personalInfo'],
    });
  }

  // وظيفة للبحث عن عروض مرتبطة بمستقل معين
  async findByFreelancerId(freelancerId: number): Promise<Bid[]> {
    return this.find({
      where: { freelancer: { id: freelancerId } },
      relations: [
        'project',
        'freelancer',
        'freelancer.personalInfo',
        'owner',
        'owner.personalInfo',
      ],
    });
  }
}
