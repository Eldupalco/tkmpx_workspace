import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateUserDto } from '../dto/create-user.dto.js';
import { UpdateUserDto } from '../dto/update-user.dto.js';
import { QueryUserDto } from '../dto/query-user.dto.js';
import { userSelect } from '../views/user.select.js';
import { randomUUID } from 'node:crypto';
import * as argon2 from 'argon2';
import { paginated } from '../../common/utils/pagination.util.js';

@Injectable()
export class UsersService {

  constructor(private readonly prisma: PrismaService) { }

  async create(dto: CreateUserDto) {
    try {
      const passwordHash = await argon2.hash(dto.password);
      return await (this.prisma as any).users.create({
        data: {
          id: randomUUID(),
          ...dto,
          password: passwordHash,
          updatedAt: new Date(),
        },
        select: userSelect,
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        const target = error.meta?.target ? ` (${error.meta.target})` : '';
        throw new ConflictException(
          `A record with this unique field already exists${target}`,
        );
      }
      throw error;
    }
  }

  async findAll(query?: QueryUserDto) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query?.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { role: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query?.role) where.role = query.role;

    const sortBy = query?.sortBy || 'createdAt';
    const sortOrder = query?.sortOrder === 'asc' ? 'asc' : 'desc';
    const orderBy = { [sortBy]: sortOrder };

    const [total, data] = await Promise.all([
      (this.prisma as any).users.count({ where }),
      (this.prisma as any).users.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: userSelect,
      }),
    ]);

    return paginated(data, total, page, limit);
  }

  async findOne(id: string) {
    const item = await (this.prisma as any).users.findUnique({
      where: { id },
      select: userSelect,
    });
    if (!item) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return item;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);
    try {
      const data: any = {
        ...dto,
        updatedAt: new Date(),
      };
      if (dto.password) {
        data.password = await argon2.hash(dto.password);
      }
      return await (this.prisma as any).users.update({
        where: { id },
        data,
        select: userSelect,
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        const target = error.meta?.target ? ` (${error.meta.target})` : '';
        throw new ConflictException(
          `A record with this unique field already exists${target}`,
        );
      }
      throw error;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    return (this.prisma as any).users.delete({
      where: { id },
      select: userSelect,
    });
  }
}
