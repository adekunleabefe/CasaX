import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Prisma,
  PropertyListingStatus,
  PropertyVerificationStatus,
  UnitReadinessStatus,
  UnitStatus,
  VacancyStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PublicRentalsQueryDto } from './dto/public-rentals-query.dto';

const publicRentalInclude = {
  unit: {
    include: {
      images: {
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      },
      property: {
        include: {
          _count: { select: { units: { where: { deletedAt: null } } } },
        },
      },
    },
  },
} satisfies Prisma.VacancyListingInclude;

@Injectable()
export class PublicRentalsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PublicRentalsQueryDto) {
    const where = this.publicWhere(query);
    const skip = (query.page - 1) * query.limit;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.vacancyListing.findMany({
        where,
        include: publicRentalInclude,
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: query.limit,
      }),
      this.prisma.vacancyListing.count({ where }),
    ]);

    return {
      message: 'Published CasaX rentals retrieved successfully',
      data: {
        items: items.map((listing) => this.toPublicRental(listing)),
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
      },
    };
  }

  async findOne(slug: string) {
    const listing = await this.prisma.vacancyListing.findFirst({
      where: {
        ...this.publicWhere({ page: 1, limit: 1 }),
        id: this.idFromSlug(slug),
      },
      include: publicRentalInclude,
    });
    if (!listing) {
      throw new NotFoundException('Rental not found');
    }
    return {
      message: 'Published CasaX rental retrieved successfully',
      data: this.toPublicRental(listing),
    };
  }

  private publicWhere(query: Partial<PublicRentalsQueryDto>) {
    return {
      deletedAt: null,
      status: VacancyStatus.PUBLISHED,
      unit: {
        deletedAt: null,
        status: UnitStatus.VACANT,
        readinessStatus: UnitReadinessStatus.READY,
        isPubliclyVisible: true,
        ...(query.unitType
          ? { unitType: { equals: query.unitType, mode: 'insensitive' as const } }
          : {}),
        ...(query.bedrooms !== undefined
          ? { bedroomCount: { gte: query.bedrooms } }
          : {}),
        ...(query.minRent !== undefined || query.maxRent !== undefined
          ? {
              rentAmount: {
                ...(query.minRent !== undefined ? { gte: query.minRent } : {}),
                ...(query.maxRent !== undefined ? { lte: query.maxRent } : {}),
              },
            }
          : {}),
        property: {
          deletedAt: null,
          verificationStatus: PropertyVerificationStatus.VERIFIED,
          listingStatus: PropertyListingStatus.APPROVED,
          ...(query.location
            ? {
                OR: [
                  { city: { contains: query.location, mode: 'insensitive' as const } },
                  { state: { contains: query.location, mode: 'insensitive' as const } },
                  { address: { contains: query.location, mode: 'insensitive' as const } },
                ],
              }
            : {}),
          ...(query.city
            ? { city: { equals: query.city, mode: 'insensitive' as const } }
            : {}),
        },
      },
    } satisfies Prisma.VacancyListingWhereInput;
  }

  private toPublicRental(
    listing: Prisma.VacancyListingGetPayload<{
      include: typeof publicRentalInclude;
    }>,
  ) {
    const { unit } = listing;
    const { property } = unit;
    return {
      id: listing.id,
      vacancyListingId: listing.id,
      propertyId: property.id,
      unitId: unit.id,
      slug: this.slugFor(listing),
      title: listing.title,
      description:
        listing.description ??
        'CasaX-reviewed vacancy from a verified managed property.',
      propertyName: property.name,
      unitName: unit.name,
      address: property.address,
      city: property.city,
      state: property.state,
      annualRent: Number(unit.rentAmount),
      bedrooms: unit.bedroomCount,
      bathrooms: unit.bathroomCount,
      unitType: unit.unitType,
      propertyType: property.type,
      propertyUnits: property._count.units,
      availability: 'Available now',
      amenities: unit.amenities.length
        ? unit.amenities
        : [
            'CasaX-reviewed property',
            'Verified vacancy',
            'Inspection booking available',
            'Secure application workflow',
          ],
      media: this.photoUrls(unit.images, unit.photos),
      photos: this.photoUrls(unit.images, unit.photos),
      serviceCharge: unit.serviceCharge ? Number(unit.serviceCharge) : null,
      availabilityDate: unit.availabilityDate,
      inspectionAvailability:
        unit.inspectionNotes ?? 'Inspection booking available',
      verifiedAt: listing.publishedAt ?? listing.updatedAt,
      accent: this.accentFor(listing.id),
    };
  }

  private photoLabels(value: Prisma.JsonValue | null) {
    if (!Array.isArray(value)) {
      return ['Living area', 'Unit view', 'Property exterior', 'Neighbourhood'];
    }
    const labels = value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
    return labels.length
      ? labels
      : ['Living area', 'Unit view', 'Property exterior', 'Neighbourhood'];
  }

  private photoUrls(
    images: { imageUrl: string; isCover: boolean; sortOrder: number }[],
    fallback: Prisma.JsonValue | null,
  ) {
    if (images.length > 0) {
      return [...images]
        .sort((first, second) => {
          if (first.isCover && !second.isCover) return -1;
          if (!first.isCover && second.isCover) return 1;
          return first.sortOrder - second.sortOrder;
        })
        .map((image) => image.imageUrl);
    }
    return this.photoLabels(fallback);
  }

  private slugFor(listing: { id: string; title: string }) {
    const readable = listing.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 72);
    return `${readable || 'rental'}-${listing.id}`;
  }

  private idFromSlug(slug: string) {
    const id = slug.slice(-36);
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id,
    )
      ? id
      : slug;
  }

  private accentFor(id: string) {
    const accents = [
      'from-slate-950 via-slate-900 to-emerald-900',
      'from-slate-950 via-slate-800 to-slate-700',
      'from-slate-900 via-emerald-950 to-slate-950',
    ];
    const index = id.charCodeAt(0) % accents.length;
    return accents[index];
  }
}
