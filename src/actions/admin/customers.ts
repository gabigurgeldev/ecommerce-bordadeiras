"use server";

import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function listCustomers() {
  return prisma.user.findMany({
    where: { role: Role.USER },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true } } },
  });
}

export async function getCustomer(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        include: { items: true },
      },
    },
  });
}
