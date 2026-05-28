import { Injectable, NotFoundException } from '@nestjs/common';
import { ApplicationStatus, TenancyStatus, UnitStatus } from '@prisma/client';
import { AuthUser } from '../../common/types/auth-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import { occupancyInclude } from '../occupancy/occupancy.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async landlordSummary(user: AuthUser) {
    const landlord = await this.prisma.landlord.findFirst({
      where: { userId: user.id, deletedAt: null },
      select: { id: true },
    });
    if (!landlord) {
      throw new NotFoundException('Landlord profile not found');
    }
    const unitWhere = {
      deletedAt: null,
      property: { landlordId: landlord.id, deletedAt: null },
    };
    const [
      totalProperties,
      totalUnits,
      occupiedUnits,
      vacantUnits,
      pendingApprovalUnits,
      maintenanceUnits,
      activeTenancies,
      expiringSoonTenancies,
      pendingConversions,
    ] = await this.prisma.$transaction([
      this.prisma.property.count({
        where: { landlordId: landlord.id, deletedAt: null },
      }),
      this.prisma.unit.count({ where: unitWhere }),
      this.prisma.unit.count({
        where: { ...unitWhere, status: UnitStatus.OCCUPIED },
      }),
      this.prisma.unit.count({
        where: { ...unitWhere, status: UnitStatus.VACANT },
      }),
      this.prisma.unit.count({
        where: { ...unitWhere, status: UnitStatus.PENDING_APPROVAL },
      }),
      this.prisma.unit.count({
        where: { ...unitWhere, status: UnitStatus.MAINTENANCE },
      }),
      this.prisma.tenancy.count({
        where: {
          landlordId: landlord.id,
          status: TenancyStatus.ACTIVE,
          deletedAt: null,
        },
      }),
      this.prisma.tenancy.count({
        where: {
          landlordId: landlord.id,
          status: TenancyStatus.ACTIVE,
          deletedAt: null,
          endDate: { gte: new Date(), lte: this.daysFromNow(30) },
        },
      }),
      this.prisma.vacancyApplication.count({
        where: {
          landlordId: landlord.id,
          status: ApplicationStatus.APPROVED,
          deletedAt: null,
        },
      }),
    ]);
    return {
      message: 'Landlord summary retrieved successfully',
      data: {
        totalProperties,
        totalUnits,
        occupiedUnits,
        vacantUnits,
        pendingApprovalUnits,
        maintenanceUnits,
        activeTenancies,
        expiringSoonTenancies,
        pendingConversions,
      },
    };
  }

  async occupancySummary(user: AuthUser) {
    const landlord = await this.prisma.landlord.findFirst({
      where: { userId: user.id, deletedAt: null },
      select: { id: true },
    });
    if (!landlord) throw new NotFoundException('Landlord profile not found');
    const unitWhere = {
      deletedAt: null,
      property: { landlordId: landlord.id, deletedAt: null },
    };
    const [
      activeTenancies,
      expiringSoonTenancies,
      pendingConversions,
      occupiedUnits,
      vacantUnits,
      totalUnits,
      recentActivity,
    ] = await this.prisma.$transaction([
      this.prisma.tenancy.count({
        where: {
          landlordId: landlord.id,
          status: TenancyStatus.ACTIVE,
          deletedAt: null,
        },
      }),
      this.prisma.tenancy.count({
        where: {
          landlordId: landlord.id,
          status: TenancyStatus.ACTIVE,
          deletedAt: null,
          endDate: { gte: new Date(), lte: this.daysFromNow(30) },
        },
      }),
      this.prisma.vacancyApplication.count({
        where: {
          landlordId: landlord.id,
          status: ApplicationStatus.APPROVED,
          deletedAt: null,
        },
      }),
      this.prisma.unit.count({
        where: { ...unitWhere, status: UnitStatus.OCCUPIED },
      }),
      this.prisma.unit.count({
        where: { ...unitWhere, status: UnitStatus.VACANT },
      }),
      this.prisma.unit.count({ where: unitWhere }),
      this.prisma.occupancyRecord.findMany({
        where: { property: { landlordId: landlord.id, deletedAt: null } },
        include: occupancyInclude,
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);
    return {
      message: 'Occupancy summary retrieved successfully',
      data: {
        activeTenancies,
        expiringSoonTenancies,
        pendingConversions,
        occupiedUnits,
        vacantUnits,
        occupancyRate: totalUnits
          ? Math.round((occupiedUnits / totalUnits) * 100)
          : 0,
        recentActivity,
      },
    };
  }

  private daysFromNow(days: number) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }
}
