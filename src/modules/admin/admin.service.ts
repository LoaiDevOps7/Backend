import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from './admin.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
  ) {}

  async createAdmin(
    username: string,
    password: string,
    roles: string[],
  ): Promise<Admin> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = this.adminRepository.create({
      username,
      password: hashedPassword,
      roles,
    });
    return this.adminRepository.save(admin);
  }

  async findOne(username: string): Promise<Admin | undefined> {
    return this.adminRepository.findOne({ where: { username } });
  }
}
