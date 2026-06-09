-- SEO fields for catalog categories
ALTER TABLE "Category"
  ADD COLUMN IF NOT EXISTS "seoTitle" TEXT,
  ADD COLUMN IF NOT EXISTS "seoDescription" TEXT;
