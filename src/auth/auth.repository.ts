import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createAdminUser(data: {
    password: string;
    email: string;
    username: string;
    role_id: string;
  }) {
    return await this.prismaService.users.create({
      data: {
        password_hash: data.password,
        email: data.email,
        username: data.username,
        role_id: data.role_id,
      },
    });
  }

  async findUserById(userId: string) {
    return await this.prismaService.users.findUnique({
      where: {
        user_id: userId,
      },
    });
  }

  async findUserByEmail(email: string) {
    return await this.prismaService.users.findUnique({
      where: {
        email,
      },
    });
  }
}
