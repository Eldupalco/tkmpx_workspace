import { Prisma } from '../../generated/prisma/client.js';

export const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.usersSelect;

export type UserPayload = Prisma.usersGetPayload<{
  select: typeof userSelect;
}>;
