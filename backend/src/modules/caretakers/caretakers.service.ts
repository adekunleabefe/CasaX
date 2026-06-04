import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthUser } from '../../common/types/auth-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { AssignCaretakerDto } from './dto/assign-caretaker.dto';

const assignmentInclude = {
  caretaker: {
    include: {
      user: { select: { email: true, profile: true } },
    },
  },
  property: {
    select: { id: true, name: true, address: true, city: true, state: true },
  },
} satisfies Prisma.CaretakerAssignmentInclude;

@Injectable()
export class CaretakersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  async assign(user: AuthUser, propertyId: string, dto: AssignCaretakerDto) {
    await this.subscriptionsService.assertCanAssignCaretaker(user.id);
    const landlordId = await this.requireLandlordId(user.id);
    await this.assertOwnedProperty(propertyId, landlordId);
    const caretaker = await this.prisma.caretaker.findFirst({
      where: {
        deletedAt: null,
        user: {
          email: dto.caretakerEmail.trim().toLowerCase(),
          deletedAt: null,
          isActive: true,
        },
      },
      select: { id: true },
    });
    if (!caretaker) {
      throw new NotFoundException('Caretaker account not found');
    }

    try {
      const assignment = await this.prisma.$transaction(
        async (tx) => {
          const duplicate = await tx.caretakerAssignment.findFirst({
            where: { propertyId, caretakerId: caretaker.id, endedAt: null },
            select: { id: true },
          });
          if (duplicate) {
            throw new ConflictException(
              'Caretaker is already assigned to this property',
            );
          }
          const created = await tx.caretakerAssignment.create({
            data: { propertyId, caretakerId: caretaker.id, landlordId },
            include: assignmentInclude,
          });
          await tx.activityLog.create({
            data: {
              actorId: user.id,
              action: 'caretaker.assignment.created',
              entityType: 'CaretakerAssignment',
              entityId: created.id,
              metadata: { propertyId, caretakerId: caretaker.id },
            },
          });
          return created;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      return {
        message: 'Caretaker assigned successfully',
        data: assignment,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034'
      ) {
        throw new ConflictException(
          'Caretaker is already assigned to this property',
        );
      }
      throw error;
    }
  }

  async listForProperty(user: AuthUser, propertyId: string) {
    const landlordId = await this.requireLandlordId(user.id);
    await this.assertOwnedProperty(propertyId, landlordId);
    const assignments = await this.prisma.caretakerAssignment.findMany({
      where: { propertyId, landlordId, endedAt: null },
      include: assignmentInclude,
      orderBy: { assignedAt: 'desc' },
    });
    return {
      message: 'Caretaker assignments retrieved successfully',
      data: assignments,
    };
  }

  async listPortfolioAssignments(user: AuthUser) {
    const landlordId = await this.requireLandlordId(user.id);
    const assignments = await this.prisma.caretakerAssignment.findMany({
      where: {
        landlordId,
        endedAt: null,
        property: { deletedAt: null },
        caretaker: { deletedAt: null },
      },
      include: assignmentInclude,
      orderBy: { assignedAt: 'desc' },
    });
    return {
      message: 'Portfolio caretaker assignments retrieved successfully',
      data: assignments,
    };
  }

  async remove(user: AuthUser, propertyId: string, caretakerId: string) {
    const landlordId = await this.requireLandlordId(user.id);
    await this.assertOwnedProperty(propertyId, landlordId);
    const assignment = await this.prisma.caretakerAssignment.findFirst({
      where: { propertyId, caretakerId, landlordId, endedAt: null },
      select: { id: true },
    });
    if (!assignment) {
      throw new NotFoundException('Active caretaker assignment not found');
    }
    const endedAt = new Date();
    await this.prisma.$transaction([
      this.prisma.caretakerAssignment.update({
        where: { id: assignment.id },
        data: { endedAt },
      }),
      this.prisma.activityLog.create({
        data: {
          actorId: user.id,
          action: 'caretaker.assignment.ended',
          entityType: 'CaretakerAssignment',
          entityId: assignment.id,
          metadata: { propertyId, caretakerId, endedAt: endedAt.toISOString() },
        },
      }),
    ]);
    return { message: 'Caretaker assignment removed successfully', data: null };
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
      select: { id: true },
    });
    if (!property) {
      throw new NotFoundException('Property not found');
    }
  }
}
