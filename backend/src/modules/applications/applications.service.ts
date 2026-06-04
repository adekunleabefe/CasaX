import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ApplicationStatus,
  Prisma,
  PropertyListingStatus,
  PropertyVerificationStatus,
  UnitReadinessStatus,
  UnitStatus,
  UserRole,
  VacancyStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { AuthUser } from '../../common/types/auth-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import {
  ApplicationStatusInput,
  ListApplicationsQueryDto,
} from './dto/list-applications-query.dto';
import {
  RejectApplicationDto,
  UpdateApplicationDto,
} from './dto/update-application.dto';

const applicationStatusMap: Record<ApplicationStatusInput, ApplicationStatus> =
  {
    [ApplicationStatusInput.PENDING]: ApplicationStatus.PENDING,
    [ApplicationStatusInput.SUBMITTED]: ApplicationStatus.PENDING,
    [ApplicationStatusInput.INSPECTION_REQUIRED]:
      ApplicationStatus.INSPECTION_REQUIRED,
    [ApplicationStatusInput.INSPECTION_SCHEDULED]:
      ApplicationStatus.INSPECTION_SCHEDULED,
    [ApplicationStatusInput.INSPECTION_BOOKED]:
      ApplicationStatus.INSPECTION_SCHEDULED,
    [ApplicationStatusInput.UNDER_REVIEW]: ApplicationStatus.UNDER_REVIEW,
    [ApplicationStatusInput.APPROVED]: ApplicationStatus.APPROVED,
    [ApplicationStatusInput.REJECTED]: ApplicationStatus.REJECTED,
    [ApplicationStatusInput.CONVERTED_TO_TENANT]:
      ApplicationStatus.CONVERTED_TO_TENANT,
    [ApplicationStatusInput.CONVERTED_TO_RESIDENT]:
      ApplicationStatus.CONVERTED_TO_TENANT,
  };
const finalizedStatuses: ApplicationStatus[] = [
  ApplicationStatus.APPROVED,
  ApplicationStatus.REJECTED,
  ApplicationStatus.CONVERTED_TO_TENANT,
];
const allowedStatusTransitions: Partial<
  Record<ApplicationStatus, ApplicationStatus[]>
> = {
  [ApplicationStatus.PENDING]: [
    ApplicationStatus.INSPECTION_REQUIRED,
    ApplicationStatus.INSPECTION_SCHEDULED,
    ApplicationStatus.INSPECTION_BOOKED,
    ApplicationStatus.UNDER_REVIEW,
  ],
  [ApplicationStatus.INSPECTION_REQUIRED]: [
    ApplicationStatus.INSPECTION_SCHEDULED,
    ApplicationStatus.UNDER_REVIEW,
  ],
  [ApplicationStatus.INSPECTION_SCHEDULED]: [ApplicationStatus.UNDER_REVIEW],
  [ApplicationStatus.INSPECTION_BOOKED]: [ApplicationStatus.UNDER_REVIEW],
};

const applicationInclude = {
  applicant: {
    include: {
      user: { select: { id: true, email: true, profile: true } },
    },
  },
  property: {
    select: { id: true, name: true, address: true, city: true, state: true },
  },
  unit: {
    select: {
      id: true,
      name: true,
      unitType: true,
      bedroomCount: true,
      rentAmount: true,
      status: true,
    },
  },
  assignedCaretaker: {
    include: {
      user: { select: { id: true, email: true, profile: true } },
    },
  },
  createdBy: {
    select: { id: true, email: true, role: true, profile: true },
  },
  approvalHistory: {
    include: {
      reviewedBy: {
        select: { id: true, email: true, profile: true },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
} satisfies Prisma.VacancyApplicationInclude;

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthUser, dto: CreateApplicationDto) {
    const access = await this.authorizeSubmission(user, dto);
    try {
      const application = await this.prisma.$transaction(
        async (tx) => {
          const availableUnit = await tx.unit.findFirst({
            where: {
              id: dto.unitId,
              propertyId: dto.propertyId,
              deletedAt: null,
              status: UnitStatus.VACANT,
              property: { deletedAt: null },
            },
            select: { id: true },
          });
          if (!availableUnit) {
            throw new ConflictException(
              'This unit is no longer available for application',
            );
          }
          if (dto.vacancyListingId) {
            const listing = await tx.vacancyListing.findFirst({
              where: {
                id: dto.vacancyListingId,
                unitId: dto.unitId,
                deletedAt: null,
              },
              select: { id: true },
            });
            if (!listing) {
              throw new BadRequestException(
                'Vacancy listing does not match unit',
              );
            }
          }
          const applicantId = await this.resolveApplicant(tx, user, dto);
          const existing = await tx.vacancyApplication.findFirst({
            where: {
              applicantId,
              unitId: dto.unitId,
              deletedAt: null,
              status: { not: ApplicationStatus.REJECTED },
            },
            select: { id: true },
          });
          if (existing) {
            throw new ConflictException(
              'An active application already exists for this applicant and unit',
            );
          }
          const created = await tx.vacancyApplication.create({
            data: {
              applicantId,
              vacancyListingId: dto.vacancyListingId,
              propertyId: dto.propertyId,
              unitId: dto.unitId,
              landlordId: access.landlordId,
              assignedCaretakerId: access.caretakerId,
              createdById: user.id,
              notes: dto.notes?.trim(),
            },
            include: applicationInclude,
          });
          await tx.unit.update({
            where: { id: dto.unitId },
            data: { status: UnitStatus.PENDING_APPROVAL },
          });
          await tx.activityLog.create({
            data: {
              actorId: user.id,
              action: 'application.created',
              entityType: 'VacancyApplication',
              entityId: created.id,
              metadata: {
                propertyId: dto.propertyId,
                unitId: dto.unitId,
                submittedByRole: user.role,
                assignedCaretakerId: access.caretakerId,
              },
            },
          });
          return created;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      return {
        message: 'Application submitted successfully',
        data: application,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034'
      ) {
        throw new ConflictException(
          'This unit is no longer available for application',
        );
      }
      throw error;
    }
  }

  async findAll(user: AuthUser, query: ListApplicationsQueryDto) {
    const scope = await this.accessScope(user);
    const where: Prisma.VacancyApplicationWhereInput = {
      ...scope,
      deletedAt: null,
      ...(query.status ? { status: applicationStatusMap[query.status] } : {}),
      ...(query.propertyId ? { propertyId: query.propertyId } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.vacancyApplication.findMany({
        where,
        include: applicationInclude,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.vacancyApplication.count({ where }),
    ]);
    return {
      message: 'Applications retrieved successfully',
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
    const application = await this.findAccessibleApplication(user, id);
    return { message: 'Application retrieved successfully', data: application };
  }

  async availableUnits(user: AuthUser) {
    let propertyScope: Prisma.PropertyWhereInput;
    if (user.role === UserRole.LANDLORD) {
      propertyScope = { landlordId: await this.requireLandlordId(user.id) };
    } else if (user.role === UserRole.CARETAKER) {
      const caretakerId = await this.requireCaretakerId(user.id);
      propertyScope = {
        caretakerAssignments: { some: { caretakerId, endedAt: null } },
      };
    } else {
      throw new ForbiddenException('Manual intake is not available');
    }
    const properties = await this.prisma.property.findMany({
      where: { ...propertyScope, deletedAt: null },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        state: true,
        units: {
          where: { deletedAt: null, status: UnitStatus.VACANT },
          select: {
            id: true,
            propertyId: true,
            name: true,
            rentAmount: true,
            bedroomCount: true,
            unitType: true,
            status: true,
            isPubliclyVisible: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
    return {
      message: 'Available units retrieved successfully',
      data: properties,
    };
  }

  async update(user: AuthUser, id: string, dto: UpdateApplicationDto) {
    const existing = await this.findAccessibleApplication(user, id);
    if (
      dto.status &&
      [
        ApplicationStatusInput.APPROVED,
        ApplicationStatusInput.REJECTED,
        ApplicationStatusInput.CONVERTED_TO_TENANT,
      ].includes(dto.status)
    ) {
      throw new BadRequestException('Use a decision endpoint for final status');
    }
    if (dto.status && finalizedStatuses.includes(existing.status)) {
      throw new ConflictException('Finalized applications cannot be changed');
    }
    const nextStatus = dto.status
      ? applicationStatusMap[dto.status]
      : existing.status;
    if (
      nextStatus !== existing.status &&
      !allowedStatusTransitions[existing.status]?.includes(nextStatus)
    ) {
      throw new ConflictException('Invalid application status transition');
    }
    const application = await this.prisma.$transaction(async (tx) => {
      await tx.vacancyApplication.update({
        where: { id },
        data: {
          ...(dto.notes !== undefined ? { notes: dto.notes.trim() } : {}),
          ...(nextStatus !== existing.status ? { status: nextStatus } : {}),
        },
      });
      if (nextStatus !== existing.status) {
        await tx.applicationApprovalHistory.create({
          data: {
            applicationId: id,
            reviewedById: user.id,
            fromStatus: existing.status,
            toStatus: nextStatus,
            note: dto.notes?.trim(),
          },
        });
      }
      await tx.activityLog.create({
        data: {
          actorId: user.id,
          action: 'application.updated',
          entityType: 'VacancyApplication',
          entityId: id,
          metadata: { status: nextStatus, changedFields: Object.keys(dto) },
        },
      });
      return tx.vacancyApplication.findUniqueOrThrow({
        where: { id },
        include: applicationInclude,
      });
    });
    return { message: 'Application updated successfully', data: application };
  }

  async approve(user: AuthUser, id: string) {
    const existing = await this.findLandlordApplication(user, id);
    if (finalizedStatuses.includes(existing.status)) {
      throw new ConflictException('This application cannot be approved');
    }
    const application = await this.recordDecision(
      user,
      existing,
      ApplicationStatus.APPROVED,
    );
    return { message: 'Application approved successfully', data: application };
  }

  async reject(user: AuthUser, id: string, dto: RejectApplicationDto) {
    const existing = await this.findLandlordApplication(user, id);
    if (finalizedStatuses.includes(existing.status)) {
      throw new ConflictException('This application cannot be rejected');
    }
    const application = await this.recordDecision(
      user,
      existing,
      ApplicationStatus.REJECTED,
      dto.reason?.trim(),
    );
    return { message: 'Application rejected successfully', data: application };
  }

  async summary(user: AuthUser) {
    const landlordId = await this.requireLandlordId(user.id);
    const where = { landlordId, deletedAt: null };
    const newApplicantWindow = new Date();
    newApplicantWindow.setDate(newApplicantWindow.getDate() - 30);
    const [
      totalApplications,
      newApplicantRecords,
      pendingApprovals,
      approvedApplications,
      rejectedApplications,
      attributedApplications,
    ] = await this.prisma.$transaction([
      this.prisma.vacancyApplication.count({ where }),
      this.prisma.vacancyApplication.findMany({
        where: { ...where, createdAt: { gte: newApplicantWindow } },
        distinct: ['applicantId'],
        select: { applicantId: true },
      }),
      this.prisma.vacancyApplication.count({
        where: {
          ...where,
          status: {
            in: [
              ApplicationStatus.PENDING,
              ApplicationStatus.INSPECTION_BOOKED,
              ApplicationStatus.UNDER_REVIEW,
            ],
          },
        },
      }),
      this.prisma.vacancyApplication.count({
        where: { ...where, status: ApplicationStatus.APPROVED },
      }),
      this.prisma.vacancyApplication.count({
        where: { ...where, status: ApplicationStatus.REJECTED },
      }),
      this.prisma.vacancyApplication.findMany({
        where: { ...where, assignedCaretakerId: { not: null } },
        select: { assignedCaretakerId: true },
      }),
    ]);
    const applicationCounts = attributedApplications.reduce((counts, item) => {
      if (item.assignedCaretakerId) {
        counts.set(
          item.assignedCaretakerId,
          (counts.get(item.assignedCaretakerId) ?? 0) + 1,
        );
      }
      return counts;
    }, new Map<string, number>());
    const caretakerIds = [...applicationCounts.keys()];
    const caretakers = await this.prisma.caretaker.findMany({
      where: { id: { in: caretakerIds } },
      include: { user: { select: { email: true, profile: true } } },
    });
    const caretakerMap = new Map(caretakers.map((item) => [item.id, item]));
    return {
      message: 'Application summary retrieved successfully',
      data: {
        totalApplications,
        newApplicants: newApplicantRecords.length,
        pendingApprovals,
        approvedApplications,
        rejectedApplications,
        applicationsByCaretaker: caretakerIds.flatMap((caretakerId) => {
          const caretaker = caretakerMap.get(caretakerId);
          return caretaker
            ? [
                {
                  caretaker,
                  totalApplications: applicationCounts.get(caretakerId) ?? 0,
                },
              ]
            : [];
        }),
      },
    };
  }

  private async authorizeSubmission(user: AuthUser, dto: CreateApplicationDto) {
    const unit = await this.prisma.unit.findFirst({
      where: {
        id: dto.unitId,
        propertyId: dto.propertyId,
        deletedAt: null,
        property: { deletedAt: null },
      },
      select: {
        status: true,
        readinessStatus: true,
        isPubliclyVisible: true,
        property: {
          select: {
            landlordId: true,
            verificationStatus: true,
            listingStatus: true,
          },
        },
      },
    });
    if (!unit) {
      throw new NotFoundException('Unit not found');
    }
    if (unit.status !== UnitStatus.VACANT) {
      throw new ConflictException('Only vacant units can receive applications');
    }
    const landlordId = unit.property.landlordId;
    if (user.role === UserRole.LANDLORD) {
      const ownedLandlordId = await this.requireLandlordId(user.id);
      if (ownedLandlordId !== landlordId) {
        throw new NotFoundException('Property not found');
      }
      const caretakerId = dto.assignedCaretakerId
        ? await this.requireAssignedCaretaker(
            dto.propertyId,
            dto.assignedCaretakerId,
          )
        : undefined;
      return { landlordId, caretakerId };
    }
    if (user.role === UserRole.CARETAKER) {
      const caretakerId = await this.requireCaretakerId(user.id);
      await this.requireAssignedCaretaker(dto.propertyId, caretakerId);
      return { landlordId, caretakerId };
    }
    if (!dto.vacancyListingId) {
      throw new BadRequestException(
        'Published vacancy listing is required for renter applications',
      );
    }
    if (
      !unit.isPubliclyVisible ||
      unit.readinessStatus !== UnitReadinessStatus.READY ||
      unit.property.verificationStatus !== PropertyVerificationStatus.VERIFIED ||
      unit.property.listingStatus !== PropertyListingStatus.APPROVED
    ) {
      throw new ForbiddenException(
        'This unit is not available for applications',
      );
    }
    const listing = await this.prisma.vacancyListing.findFirst({
      where: {
        id: dto.vacancyListingId,
        unitId: dto.unitId,
        deletedAt: null,
        status: VacancyStatus.PUBLISHED,
      },
      select: { id: true },
    });
    if (!listing) {
      throw new NotFoundException('Published rental not found');
    }
    return { landlordId, caretakerId: undefined };
  }

  private async resolveApplicant(
    tx: Prisma.TransactionClient,
    user: AuthUser,
    dto: CreateApplicationDto,
  ): Promise<string> {
    if (user.role === UserRole.APPLICANT || user.role === UserRole.TENANT) {
      const applicant = await tx.applicant.findFirst({
        where: { userId: user.id, deletedAt: null },
        select: { id: true },
      });
      if (applicant) {
        return applicant.id;
      }
      if (user.role === UserRole.APPLICANT) {
        throw new NotFoundException('Applicant profile not found');
      }
      const createdApplicant = await tx.applicant.create({
        data: { userId: user.id },
        select: { id: true },
      });
      return createdApplicant.id;
    }
    if (!dto.applicant) {
      throw new BadRequestException(
        'Applicant information is required for a manual submission',
      );
    }
    const email = dto.applicant.email.trim().toLowerCase();
    const existing = await tx.user.findUnique({
      where: { email },
      include: { applicant: true },
    });
    if (existing) {
      if (!existing.applicant || existing.deletedAt) {
        throw new ConflictException('Email belongs to another account type');
      }
      return existing.applicant.id;
    }
    const passwordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 12);
    const created = await tx.user.create({
      data: {
        email,
        passwordHash,
        role: UserRole.APPLICANT,
        isActive: false,
        profile: {
          create: {
            firstName: dto.applicant.firstName.trim(),
            lastName: dto.applicant.lastName.trim(),
            phone: dto.applicant.phone?.trim(),
          },
        },
        applicant: { create: {} },
      },
      select: { applicant: { select: { id: true } } },
    });
    if (!created.applicant) {
      throw new ConflictException('Applicant could not be created');
    }
    return created.applicant.id;
  }

  private async recordDecision(
    user: AuthUser,
    existing: {
      id: string;
      status: ApplicationStatus;
      unitId: string;
      propertyId: string;
    },
    toStatus: ApplicationStatus,
    note?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const decision = await tx.vacancyApplication.updateMany({
        where: {
          id: existing.id,
          deletedAt: null,
          status: { notIn: finalizedStatuses },
        },
        data: {
          status: toStatus,
          reviewedAt: new Date(),
          rejectionReason:
            toStatus === ApplicationStatus.REJECTED ? note : null,
        },
      });
      if (decision.count !== 1) {
        throw new ConflictException(
          'This application decision has already been recorded',
        );
      }
      await tx.applicationApprovalHistory.create({
        data: {
          applicationId: existing.id,
          reviewedById: user.id,
          fromStatus: existing.status,
          toStatus,
          note,
        },
      });
      if (toStatus === ApplicationStatus.REJECTED) {
        await tx.unit.updateMany({
          where: {
            id: existing.unitId,
            status: UnitStatus.PENDING_APPROVAL,
          },
          data: { status: UnitStatus.VACANT },
        });
      }
      await tx.activityLog.create({
        data: {
          actorId: user.id,
          action:
            toStatus === ApplicationStatus.APPROVED
              ? 'application.approved'
              : 'application.rejected',
          entityType: 'VacancyApplication',
          entityId: existing.id,
          metadata: {
            propertyId: existing.propertyId,
            unitId: existing.unitId,
            note,
          },
        },
      });
      return tx.vacancyApplication.findUniqueOrThrow({
        where: { id: existing.id },
        include: applicationInclude,
      });
    });
  }

  private async findLandlordApplication(user: AuthUser, id: string) {
    const landlordId = await this.requireLandlordId(user.id);
    const application = await this.prisma.vacancyApplication.findFirst({
      where: { id, landlordId, deletedAt: null },
      include: applicationInclude,
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    return application;
  }

  private async findAccessibleApplication(user: AuthUser, id: string) {
    const scope = await this.accessScope(user);
    const application = await this.prisma.vacancyApplication.findFirst({
      where: { id, deletedAt: null, ...scope },
      include: applicationInclude,
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    return application;
  }

  private async accessScope(
    user: AuthUser,
  ): Promise<Prisma.VacancyApplicationWhereInput> {
    if (user.role === UserRole.LANDLORD) {
      return { landlordId: await this.requireLandlordId(user.id) };
    }
    if (user.role === UserRole.CARETAKER) {
      const caretakerId = await this.requireCaretakerId(user.id);
      return {
        property: {
          caretakerAssignments: { some: { caretakerId, endedAt: null } },
        },
      };
    }
    if (user.role === UserRole.APPLICANT || user.role === UserRole.TENANT) {
      const applicant = await this.prisma.applicant.findFirst({
        where: { userId: user.id, deletedAt: null },
        select: { id: true },
      });
      if (!applicant) {
        if (user.role === UserRole.TENANT) {
          return { applicantId: '00000000-0000-0000-0000-000000000000' };
        }
        throw new NotFoundException('Applicant profile not found');
      }
      return { applicantId: applicant.id };
    }
    throw new ForbiddenException('Applications are not available for this role');
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

  private async requireCaretakerId(userId: string): Promise<string> {
    const caretaker = await this.prisma.caretaker.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true },
    });
    if (!caretaker) {
      throw new NotFoundException('Caretaker profile not found');
    }
    return caretaker.id;
  }

  private async requireAssignedCaretaker(
    propertyId: string,
    caretakerId: string,
  ) {
    const assignment = await this.prisma.caretakerAssignment.findFirst({
      where: {
        propertyId,
        caretakerId,
        endedAt: null,
        property: { deletedAt: null },
        caretaker: { deletedAt: null },
      },
      select: { caretakerId: true },
    });
    if (!assignment) {
      throw new ForbiddenException(
        'Caretaker does not have access to this property',
      );
    }
    return assignment.caretakerId;
  }
}
