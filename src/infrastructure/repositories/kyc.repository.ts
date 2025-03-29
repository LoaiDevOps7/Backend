// import { DataSource, Repository } from 'typeorm';
// import { Kyc } from '@/modules/kyc/kyc.entity';
// import { Injectable } from '@nestjs/common';

// @Injectable()
// export class KycRepository extends Repository<Kyc> {
//   constructor(private dataSource: DataSource) {
//     super(Kyc, dataSource.createEntityManager());
//   }

//   // وظيفة للبحث عن Kyc بناءً على الـ userId
//   async findByUserId(userId: number): Promise<Kyc | undefined> {
//     return await this.findOne({
//       where: { user: { id: userId } },
//       relations: ['user'],
//     });
//   }

//   // وظيفة لإنشاء أو تحديث Kyc
//   async createOrUpdateKyc(userId: number, kycData: Partial<Kyc>): Promise<Kyc> {
//     let kyc = await this.findByUserId(userId);

//     if (!kyc) {
//       // إنشاء KYC جديد مع تحديد العلاقة بشكل صحيح
//       kyc = this.create({
//         ...kycData,
//         user: { id: userId },
//         verificationStatus: 'pending',
//       });
//     } else {
//       // دمج البيانات الجديدة مع الكائن الموجود
//       kyc = this.merge(kyc, kycData);
//     }

//     try {
//       return await this.save(kyc);
//     } catch {
//       throw new Error('Failed to create or update KYC');
//     }
//   }
// }
