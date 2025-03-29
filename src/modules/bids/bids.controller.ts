import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { BidService } from './bids.service';
import { CreateBidDto } from './dto/create-bid.dto';
import { Bid } from './bids.entity';
import { JwtGuard } from '@/core/guards/jwt.guard';

@Controller('bids')
// @UseGuards(JwtGuard)
export class BidController {
  constructor(private readonly bidService: BidService) {}

  // إنشاء عرض
  @Post('create')
  async create(@Body() createBidDto: CreateBidDto): Promise<Bid> {
    return this.bidService.createBid(createBidDto);
  }

  // الحصول على العروض بناءً على المشروع
  @Get('project/:projectId')
  async findByProject(@Param('projectId') projectId: string): Promise<Bid[]> {
    return this.bidService.findByProject(projectId);
  }

  // الحصول على العروض بناءً على المستقل
  @Get('freelancer/:freelancerId')
  async findByFreelancer(
    @Param('freelancerId') freelancerId: number,
  ): Promise<Bid[]> {
    return this.bidService.findByFreelancer(freelancerId);
  }
}
