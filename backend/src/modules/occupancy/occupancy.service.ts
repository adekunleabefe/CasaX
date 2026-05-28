import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { AuthUser } from '../../common/types/auth-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import { ListOccupancyQueryDto } from './dto/list-occupancy-query.dto';

export const occupancyInclude = {
  user: { select: { id: true, email: true, role: true, profile: true } },
  property: {
    select: { id: true, name: true, address: true, city: true, state: true },
  },
  unit: {
    select: { id: true, name: true, unitType: true, bedroomCount: true },
  },
  tenancy: {
    include: {
      user: { select: { id: true, email: true, role: true, profile: true } },
      applicant: {
        include: {
          user: {
            select: { id: true, email: true, role: true, profile: true },
          },
        },
      },
      property: {
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          state: true,
        },
      },
      unit: {
        select: { id: true, name: true, unitType: true, bedroomCount: true },
      },
    },
  },
} satisfies Prisma.OccupancyRecordInclude;

@Injectable()
export class OccupancyService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: AuthUser, query: ListOccupancyQueryDto) {
    const where: Prisma.OccupancyRecordWhereInput =
      await this.accessScope(user);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.occupancyRecord.findMany({
        where,
        include: occupancyInclude,
        orderBy: { moveInDate: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.occupancyRecord.count({ where }),
    ]);
    return {
      message: 'Occupancy records retrieved successfully',
      data: {
        items,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
      },
    };
  }

  async unitHistory(user: AuthUser, unitId: string) {
    const scope = await this.accessScope(user);
    const unit = await this.prisma.unit.findFirst({
      where: {
        id: unitId,
        deletedAt: null,
        ...(await this.unitAccessScope(user)),
      },
      select: { id: true },
    });
    if (!unit) throw new NotFoundException('Unit occupancy history not found');
    const records = await this.prisma.occupancyRecord.findMany({
      where: { unitId, ...scope },
      include: occupancyInclude,
      orderBy: { moveInDate: 'desc' },
    });
    return {
      message: 'Unit occupancy history retrieved successfully',
      data: records,
    };
  }

  private async accessScope(
    user: AuthUser,
  ): Promise<Prisma.OccupancyRecordWhereInput> {
    if (user.role === UserRole.LANDLORD) {
      const landlord = await this.prisma.landlord.findFirst({
        where: { userId: user.id, deletedAt: null },
        select: { id: true },
      });
      if (!landlord) throw new NotFoundException('Landlord profile not found');
      return { property: { landlordId: landlord.id, deletedAt: null } };
    }
    if (user.role === UserRole.CARETAKER) {
      const caretaker = await this.prisma.caretaker.findFirst({
        where: { userId: user.id, deletedAt: null },
        select: { id: true },
      });
      if (!caretaker)
        throw new NotFoundException('Caretaker profile not found');
      return {
        property: {
          caretakerAssignments: {
            some: { caretakerId: caretaker.id, endedAt: null },
          },
        },
      };
    }
    if (user.role === UserRole.TENANT) return { userId: user.id };
    throw new ForbiddenException('Occupancy access is not available');
  }

  private async unitAccessScope(
    user: AuthUser,
  ): Promise<Prisma.UnitWhereInput> {
    if (user.role === UserRole.LANDLORD) {
      const landlord = await this.prisma.landlord.findFirst({
        where: { userId: user.id, deletedAt: null },
        select: { id: true },
      });
      if (!landlord) throw new NotFoundException('Landlord profile not found');
      return { property: { landlordId: landlord.id, deletedAt: null } };
    }
    if (user.role === UserRole.CARETAKER) {
      const caretaker = await this.prisma.caretaker.findFirst({
        where: { userId: user.id, deletedAt: null },
        select: { id: true },
      });
      if (!caretaker)
        throw new NotFoundException('Caretaker profile not found');
      return {
        property: {
          caretakerAssignments: {
            some: { caretakerId: caretaker.id, endedAt: null },
          },
        },
      };
    }
    if (user.role === UserRole.TENANT) {
      return { occupancyRecords: { some: { userId: user.id } } };
    }
    throw new ForbiddenException('Occupancy access is not available');
  }
}
