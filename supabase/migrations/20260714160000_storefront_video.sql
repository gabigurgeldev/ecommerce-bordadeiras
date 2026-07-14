-- Storefront videos gallery (public /videos page)

CREATE TABLE "StorefrontVideo" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorefrontVideo_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StorefrontVideo_active_sortOrder_idx" ON "StorefrontVideo"("active", "sortOrder");

ALTER TABLE "StorefrontVideo" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_active_videos"
  ON "StorefrontVideo"
  FOR SELECT
  TO anon, authenticated
  USING (active = true);

CREATE POLICY "admin_all_storefrontvideo"
  ON "StorefrontVideo"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
