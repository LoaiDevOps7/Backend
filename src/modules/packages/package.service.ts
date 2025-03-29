import { Injectable } from '@nestjs/common';
import { PackageRepository } from '@/infrastructure/repositories/package.repository';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { Package } from './package.entity';

@Injectable()
export class PackageService {
  constructor(private readonly packageRepository: PackageRepository) {}

  async getAllPackages(): Promise<Package[]> {
    return this.packageRepository.find();
  }

  async createPackage(createPackageDto: CreatePackageDto): Promise<Package> {
    const packageEntity = this.packageRepository.create(createPackageDto);
    return await this.packageRepository.save(packageEntity);
  }

  async getPackageById(id: string): Promise<Package> {
    return this.packageRepository.findOne({ where: { id } });
  }

  async updatePackage(
    id: string,
    updatePackageDto: UpdatePackageDto,
  ): Promise<Package> {
    await this.packageRepository.update(id, updatePackageDto);
    return this.packageRepository.findOne({ where: { id } });
  }

  async deletePackage(id: number): Promise<void> {
    await this.packageRepository.delete(id);
  }

  async findPackageByName(name: string): Promise<Package | undefined> {
    return this.packageRepository.findByName(name);
  }

  async getActivePackages(): Promise<Package[]> {
    return this.packageRepository.findActivePackages();
  }
}
