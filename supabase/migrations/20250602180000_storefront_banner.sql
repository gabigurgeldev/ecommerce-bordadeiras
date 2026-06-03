-- Storefront carousel banners

CREATE TABLE "StorefrontBanner" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "link" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorefrontBanner_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StorefrontBanner_active_sortOrder_idx" ON "StorefrontBanner"("active", "sortOrder");
