"use server";

import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { withAdminRead } from "./_utils";

export async function listCustomers() {
  return withAdminRead(() =>
    prisma.user.findMany({
      where: { role: Role.USER },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { orders: true } } },
    }),
  );
}

export async function getCustomer(id: string) {
  return withAdminRead(() =>
    prisma.user.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          include: { items: true },
        },
      },
    }),
  );
}
