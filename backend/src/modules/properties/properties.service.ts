import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PropertyStatus } from '@prisma/client';
import { AuthUser } from '../../common/types/auth-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreatePropertyDto,
  propertyStatusMap,
} from './dto/create-property.dto';
import { ListPropertiesQueryDto } from './dto/list-properties-query.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';

const propertyInclude = {
  _count: {
    select: {
      units: { where: { deletedAt: null } },
    },
  },
} satisfies Prisma.PropertyInclude;

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthUser, dto: CreatePropertyDto) {
    const landlordId = await this.requireLandlordId(user.id);
    const property = await this.prisma.$transaction(async (tx) => {
      const created = await tx.property.create({
        data: {
          landlordId,
          name: dto.name.trim(),
          address: dto.address.trim(),
          city: dto.city.trim(),
          state: dto.state.trim(),
          type: dto.type.trim(),
          status: propertyStatusMap[dto.status],
        },
        include: propertyInclude,
      });
      await tx.activityLog.create({
        data: {
          actorId: user.id,
          action: 'property.created',
          entityType: 'Property',
          entityId: created.id,
          metadata: { name: created.name, status: created.status },
        },
      });
      return created;
    });
    return { message: 'Property created successfully', data: property };
  }

  async findAll(user: AuthUser, query: ListPropertiesQueryDto) {
    const landlordId = await this.requireLandlordId(user.id);
    const where: Prisma.PropertyWhereInput = {
      landlordId,
      deletedAt: null,
      ...(query.search
        ? {
            OR: ['name', 'address', 'city', 'state'].map((field) => ({
              [field]: { contains: query.search, mode: 'insensitive' },
            })),
          }
        : {}),
    };
    const skip = (query.page - 1) * query.limit;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.property.findMany({
        where,
        include: propertyInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      this.prisma.property.count({ where }),
    ]);
    return {
      message: 'Properties retrieved successfully',
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

  async findOne(user: AuthUser, id: string) {
    const landlordId = await this.requireLandlordId(user.id);
    const property = await this.prisma.property.findFirst({
      where: { id, landlordId, deletedAt: null },
      include: {
        units: {
          where: { deletedAt: null },
          orderBy: { name: 'asc' },
        },
        _count: propertyInclude._count,
      },
    });
    if (!property) {
      throw new NotFoundException('Property not found');
    }
    return { message: 'Property retrieved successfully', data: property };
  }

  async update(user: AuthUser, id: string, dto: UpdatePropertyDto) {
    const landlordId = await this.requireLandlordId(user.id);
    await this.assertOwnedProperty(id, landlordId);
    const property = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.property.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.address !== undefined ? { address: dto.address.trim() } : {}),
          ...(dto.city !== undefined ? { city: dto.city.trim() } : {}),
          ...(dto.state !== undefined ? { state: dto.state.trim() } : {}),
          ...(dto.type !== undefined ? { type: dto.type.trim() } : {}),
          ...(dto.status !== undefined
            ? { status: propertyStatusMap[dto.status] }
            : {}),
        },
        include: propertyInclude,
      });
      await tx.activityLog.create({
        data: {
          actorId: user.id,
          action: 'property.updated',
          entityType: 'Property',
          entityId: id,
          metadata: { changedFields: Object.keys(dto) },
        },
      });
      return updated;
    });
    return { message: 'Property updated successfully', data: property };
  }

  async remove(user: AuthUser, id: string) {
    const landlordId = await this.requireLandlordId(user.id);
    const existing = await this.assertOwnedProperty(id, landlordId);
    const deletedAt = new Date();
    await this.prisma.$transaction([
      this.prisma.property.update({
        where: { id },
        data: { deletedAt, status: PropertyStatus.INACTIVE },
      }),
      this.prisma.activityLog.create({
        data: {
          actorId: user.id,
          action: 'property.deleted',
          entityType: 'Property',
          entityId: id,
          metadata: { name: existing.name, deletedAt: deletedAt.toISOString() },
        },
      }),
    ]);
    return { message: 'Property deleted successfully', data: null };
  }

  private async requireLandlordId(userId: string): Promise<string> {
    const landlord = await this.prisma.landlord.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true },
    });
    if (!landlord) {
      throw new NotFoundException('Landlord profile not found');
    }
    return landlord.id;
  }

  private async assertOwnedProperty(id: string, landlordId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id, landlordId, deletedAt: null },
      select: { id: true, name: true },
    });
    if (!property) {
      throw new NotFoundException('Property not found');
    }
    return property;
  }
}
