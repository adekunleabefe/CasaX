import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

async function main() {
  const email = requiredEnv('ADMIN_EMAIL').toLowerCase();
  const password = requiredEnv('ADMIN_PASSWORD');
  const firstName = requiredEnv('ADMIN_FIRST_NAME');
  const lastName = requiredEnv('ADMIN_LAST_NAME');
  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      await tx.user.update({
        where: { id: existing.id },
        data: {
          passwordHash,
          role: UserRole.ADMIN,
          isActive: true,
          emailVerifiedAt: now,
          refreshTokenHash: null,
          deletedAt: null,
          profile: {
            upsert: {
              create: { firstName, lastName },
              update: { firstName, lastName },
            },
          },
        },
      });
      return;
    }

    await tx.user.create({
      data: {
        email,
        passwordHash,
        role: UserRole.ADMIN,
        isActive: true,
        emailVerifiedAt: now,
        profile: {
          create: { firstName, lastName },
        },
      },
    });
  });

  console.log('Admin created successfully');
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
