import { EmailType, Prisma } from '@prisma/client';

export interface EmailLink {
  label: string;
  url: string;
}

export interface EmailMessage {
  to: string;
  from: string;
  subject: string;
  type: EmailType;
  text: string;
  html: string;
  bodyPreview: string;
  metadata?: Prisma.InputJsonObject;
  importantLinks?: EmailLink[];
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<void>;
}
