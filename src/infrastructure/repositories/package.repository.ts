import { Repository, DataSource } from 'typeorm';
import { Package } from '@/modules/packages/package.entity';
import { Injectable } from '@nestjs/common';
import { CreatePackageDto } from '@/modules/packages/dto/create-package.dto';

@Injectable()
export class PackageRepository extends Repository<Package> {
  constructor(private dataSource: DataSource) {
    super(Package, dataSource.createEntityManager());
  }

  async findByName(name: string): Promise<Package | undefined> {
    return this.findOne({ where: { name } });
  }

  async findActivePackages(): Promise<Package[]> {
    return this.find({ where: { isActive: true } });
  }

  async createPackage(createPackageDto: CreatePackageDto): Promise<Package> {
    return this.create(createPackageDto);
  }
}
