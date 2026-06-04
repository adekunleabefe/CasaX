import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ApplicationStatus,
  MaintenanceStatus,
  PaymentStatus,
  TenancyStatus,
  TenantOnboardingStatus,
  UnitStatus,
} from '@prisma/client';
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

  async caretakerSummary(user: AuthUser) {
    const caretaker = await this.prisma.caretaker.findFirst({
      where: { userId: user.id, deletedAt: null },
      select: { id: true },
    });
    if (!caretaker) {
      throw new NotFoundException('Caretaker profile not found');
    }

    const assignedPropertyWhere = {
      deletedAt: null,
      caretakerAssignments: {
        some: { caretakerId: caretaker.id, endedAt: null },
      },
    };
    const assignedUnitWhere = {
      deletedAt: null,
      property: assignedPropertyWhere,
    };
    const paymentWhere = {
      deletedAt: null,
      property: assignedPropertyWhere,
    };

    const [
      assignedProperties,
      assignedUnits,
      activeTenancies,
      pendingApplications,
      pendingTenantSubmissions,
      pendingPayments,
      overduePayments,
      totalCollected,
      openMaintenanceRequests,
    ] = await this.prisma.$transaction([
      this.prisma.property.count({ where: assignedPropertyWhere }),
      this.prisma.unit.count({ where: assignedUnitWhere }),
      this.prisma.tenancy.count({
        where: {
          status: TenancyStatus.ACTIVE,
          deletedAt: null,
          property: assignedPropertyWhere,
        },
      }),
      this.prisma.vacancyApplication.count({
        where: {
          deletedAt: null,
          property: assignedPropertyWhere,
          status: {
            in: [ApplicationStatus.PENDING, ApplicationStatus.UNDER_REVIEW],
          },
        },
      }),
      this.prisma.tenantOnboardingRequest.count({
        where: {
          deletedAt: null,
          submittedByCaretakerId: caretaker.id,
          status: TenantOnboardingStatus.PENDING,
        },
      }),
      this.prisma.rentPayment.count({
        where: {
          ...paymentWhere,
          status: PaymentStatus.PENDING,
        },
      }),
      this.prisma.rentPayment.count({
        where: {
          ...paymentWhere,
          status: PaymentStatus.OVERDUE,
        },
      }),
      this.prisma.rentPayment.aggregate({
        where: {
          ...paymentWhere,
          status: PaymentStatus.PAID,
        },
        _sum: { amount: true },
      }),
      this.prisma.maintenanceRequest.count({
        where: {
          deletedAt: null,
          property: assignedPropertyWhere,
          status: {
            in: [MaintenanceStatus.PENDING, MaintenanceStatus.IN_PROGRESS],
          },
        },
      }),
    ]);

    return {
      message: 'Caretaker summary retrieved successfully',
      data: {
        assignedProperties,
        assignedUnits,
        activeTenancies,
        pendingApplications,
        pendingTenantSubmissions,
        pendingPayments,
        overduePayments,
        totalCollected: Number(totalCollected._sum.amount ?? 0),
        openMaintenanceRequests,
      },
    };
  }

  private daysFromNow(days: number) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }
}
