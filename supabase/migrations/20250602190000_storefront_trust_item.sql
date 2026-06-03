-- Storefront trust bar items

CREATE TABLE "StorefrontTrustItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "link" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorefrontTrustItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StorefrontTrustItem_active_sortOrder_idx" ON "StorefrontTrustItem"("active", "sortOrder");
