import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

interface AgreementTenancyContext {
  id: string;
  landlordId: string;
  userId: string;
  propertyId: string;
  unitId: string;
  startDate: Date;
  endDate: Date;
  rentAmount: Prisma.Decimal | number;
  paymentFrequency: string;
  property: { name: string; address: string; city: string; state: string };
  unit: { name: string };
  user: {
    email: string;
    profile?: { firstName: string; lastName: string } | null;
  };
}

export async function createDefaultAgreement(
  tx: Prisma.TransactionClient,
  tenancy: AgreementTenancyContext,
  createdById: string,
) {
  const tenantName = tenancy.user.profile
    ? `${tenancy.user.profile.firstName} ${tenancy.user.profile.lastName}`
    : tenancy.user.email;
  const agreementNumber = `CX-${new Date().getFullYear()}-${randomUUID()
    .slice(0, 8)
    .toUpperCase()}`;
  const title = `Tenancy agreement - ${tenancy.property.name} / ${tenancy.unit.name}`;
  const content = `# ${title}

Agreement number: ${agreementNumber}

This tenancy agreement is between the property landlord and **${tenantName}** for **${tenancy.unit.name}** at ${tenancy.property.address}, ${tenancy.property.city}, ${tenancy.property.state}.

## Lease terms

- Start date: ${tenancy.startDate.toISOString().slice(0, 10)}
- End date: ${tenancy.endDate.toISOString().slice(0, 10)}
- Rent amount: NGN ${Number(tenancy.rentAmount).toLocaleString('en-NG')}
- Payment frequency: ${tenancy.paymentFrequency.toLowerCase()}

## Operational record

CasaX tracks occupancy, rent records, maintenance communication, and any updates to this agreement against this tenancy record.

This draft may be reviewed and sent by the landlord before signature tracking begins.`;

  return tx.tenancyAgreement.create({
    data: {
      tenancyId: tenancy.id,
      landlordId: tenancy.landlordId,
      tenantUserId: tenancy.userId,
      propertyId: tenancy.propertyId,
      unitId: tenancy.unitId,
      title,
      agreementNumber,
      content,
      createdById,
    },
  });
}
