import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { PackageService } from './package.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { Package } from './package.entity';

@Controller('packages')
export class PackageController {
  constructor(private readonly packageService: PackageService) {}

  @Post()
  createPackage(@Body() createPackageDto: CreatePackageDto): Promise<Package> {
    return this.packageService.createPackage(createPackageDto);
  }

  @Get(':id')
  getPackageById(@Param('id') id: string): Promise<Package> {
    return this.packageService.getPackageById(id);
  }

  @Put(':id')
  updatePackage(
    @Param('id') id: string,
    @Body() updatePackageDto: UpdatePackageDto,
  ): Promise<Package> {
    return this.packageService.updatePackage(id, updatePackageDto);
  }

  @Delete(':id')
  deletePackage(@Param('id') id: number): Promise<void> {
    return this.packageService.deletePackage(id);
  }
}
