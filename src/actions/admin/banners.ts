"use server";

import { prisma } from "@/lib/prisma";
import { bannerSchema } from "@/lib/validations/admin";
import { auditMutation, revalidateAdmin, withAdmin, withAdminRead, type ActionResult } from "./_utils";

export async function listBanners() {
  return withAdminRead(() =>
    prisma.storefrontBanner.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
  );
}

export async function upsertBanner(
  data: unknown,
  id?: string,
): Promise<ActionResult<{ id: string }>> {
  return withAdmin(async (actor) => {
    const parsed = bannerSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.flatten().formErrors.join(", ") || "Dados inválidos",
      };
    }

    const payload = {
      title: parsed.data.title,
      imageUrl: parsed.data.imageUrl,
      link: parsed.data.link || null,
      sortOrder: parsed.data.sortOrder,
      active: parsed.data.active,
    };

    const banner = id
      ? await prisma.storefrontBanner.update({ where: { id }, data: payload })
      : await prisma.storefrontBanner.create({ data: payload });

    await auditMutation(actor, {
      action: id ? "UPDATE" : "CREATE",
      entity: "StorefrontBanner",
      entityId: banner.id,
    });
    revalidateAdmin(["/admin/banners", "/"]);
    return { success: true, data: { id: banner.id } };
  });
}

export async function deleteBanner(id: string): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    await prisma.storefrontBanner.delete({ where: { id } });
    await auditMutation(actor, {
      action: "DELETE",
      entity: "StorefrontBanner",
      entityId: id,
    });
    revalidateAdmin(["/admin/banners", "/"]);
    return { success: true };
  });
}

export async function toggleBannerActive(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    await prisma.storefrontBanner.update({ where: { id }, data: { active } });
    await auditMutation(actor, {
      action: "UPDATE",
      entity: "StorefrontBanner",
      entityId: id,
      metadata: { active },
    });
    revalidateAdmin(["/admin/banners", "/"]);
    return { success: true };
  });
}

export async function reorderBanners(
  orders: { id: string; sortOrder: number }[],
): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    await prisma.$transaction(
      orders.map(({ id, sortOrder }) =>
        prisma.storefrontBanner.update({ where: { id }, data: { sortOrder } }),
      ),
    );
    await auditMutation(actor, {
      action: "UPDATE",
      entity: "StorefrontBanner",
      metadata: { reorder: orders.length },
    });
    revalidateAdmin(["/admin/banners", "/"]);
    return { success: true };
  });
}
