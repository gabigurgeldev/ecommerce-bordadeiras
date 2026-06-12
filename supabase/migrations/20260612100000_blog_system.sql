-- Blog system: extended schema, soft deletes, draft versions, comments, media
-- Maps to spec: blog_posts → BlogPost, blog_categories → BlogCategory, etc.
-- Legacy columns kept: coverImage (= thumbnail), seoTitle (= meta_title), seoDescription (= meta_description), published (synced with status)

-- ─── Enums ───────────────────────────────────────────────────────────────────

CREATE TYPE "BlogPostStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED', 'SCHEDULED');
CREATE TYPE "BlogMediaType" AS ENUM ('IMAGE', 'YOUTUBE');

-- ─── BlogCategory extensions ─────────────────────────────────────────────────

ALTER TABLE "BlogCategory"
  ADD COLUMN IF NOT EXISTS "description" TEXT,
  ADD COLUMN IF NOT EXISTS "icon" TEXT,
  ADD COLUMN IF NOT EXISTS "postsCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "BlogCategory_isActive_sortOrder_idx"
  ON "BlogCategory"("isActive", "sortOrder");

-- ─── BlogPost extensions ─────────────────────────────────────────────────────

ALTER TABLE "BlogPost"
  ADD COLUMN IF NOT EXISTS "status" "BlogPostStatus" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS "youtubeUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "views" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "readingTime" INTEGER,
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- Backfill status from legacy published flag
UPDATE "BlogPost"
SET "status" = CASE WHEN "published" = true THEN 'PUBLISHED'::"BlogPostStatus" ELSE 'DRAFT'::"BlogPostStatus" END
WHERE "status" = 'DRAFT'::"BlogPostStatus" AND "published" = true;

-- Author FK (column existed without constraint)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'BlogPost_authorId_fkey'
  ) THEN
    ALTER TABLE "BlogPost"
      ADD CONSTRAINT "BlogPost_authorId_fkey"
      FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "BlogPost_authorId_idx" ON "BlogPost"("authorId");
CREATE INDEX IF NOT EXISTS "BlogPost_status_idx" ON "BlogPost"("status");
CREATE INDEX IF NOT EXISTS "BlogPost_status_publishedAt_idx"
  ON "BlogPost"("status", "publishedAt" DESC NULLS LAST)
  WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "BlogPost_deletedAt_idx" ON "BlogPost"("deletedAt");

-- Slug unique among non-deleted posts (allows slug reuse after soft delete)
DROP INDEX IF EXISTS "BlogPost_slug_key";
CREATE UNIQUE INDEX IF NOT EXISTS "BlogPost_slug_active_key"
  ON "BlogPost"("slug")
  WHERE "deletedAt" IS NULL;

-- Keep published ↔ status in sync for legacy queries and admin UI
CREATE OR REPLACE FUNCTION public.sync_blog_post_published_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW."status" = 'PUBLISHED'::"BlogPostStatus" THEN
      NEW."published" := true;
      IF NEW."publishedAt" IS NULL THEN
        NEW."publishedAt" := CURRENT_TIMESTAMP;
      END IF;
    ELSE
      NEW."published" := false;
    END IF;
    RETURN NEW;
  END IF;

  IF NEW."status" IS DISTINCT FROM OLD."status" THEN
    NEW."published" := (NEW."status" = 'PUBLISHED'::"BlogPostStatus");
    IF NEW."status" = 'PUBLISHED'::"BlogPostStatus" AND NEW."publishedAt" IS NULL THEN
      NEW."publishedAt" := CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
  END IF;

  IF NEW."published" IS DISTINCT FROM OLD."published" THEN
    IF NEW."published" = true THEN
      NEW."status" := 'PUBLISHED'::"BlogPostStatus";
      IF NEW."publishedAt" IS NULL THEN
        NEW."publishedAt" := CURRENT_TIMESTAMP;
      END IF;
    ELSIF NEW."status" = 'PUBLISHED'::"BlogPostStatus" THEN
      NEW."status" := 'DRAFT'::"BlogPostStatus";
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS blog_post_sync_published_status ON "BlogPost";
CREATE TRIGGER blog_post_sync_published_status
  BEFORE INSERT OR UPDATE OF "status", "published", "publishedAt"
  ON "BlogPost"
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_blog_post_published_status();

-- ─── BlogPostVersion (draft versioning) ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS "BlogPostVersion" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "versionNumber" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "excerpt" TEXT,
  "content" TEXT NOT NULL,
  "coverImage" TEXT,
  "youtubeUrl" TEXT,
  "seoTitle" TEXT,
  "seoDescription" TEXT,
  "categoryId" TEXT,
  "status" "BlogPostStatus" NOT NULL DEFAULT 'DRAFT',
  "tagIds" JSONB,
  "notes" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BlogPostVersion_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BlogPostVersion_postId_fkey"
    FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "BlogPostVersion_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "BlogCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "BlogPostVersion_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "BlogPostVersion_postId_versionNumber_key"
  ON "BlogPostVersion"("postId", "versionNumber");
CREATE INDEX IF NOT EXISTS "BlogPostVersion_postId_createdAt_idx"
  ON "BlogPostVersion"("postId", "createdAt" DESC);

-- ─── BlogComment ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "BlogComment" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "authorName" TEXT NOT NULL,
  "authorEmail" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "isApproved" BOOLEAN NOT NULL DEFAULT false,
  "parentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BlogComment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BlogComment_postId_fkey"
    FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "BlogComment_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "BlogComment"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "BlogComment_postId_isApproved_idx"
  ON "BlogComment"("postId", "isApproved", "createdAt");
CREATE INDEX IF NOT EXISTS "BlogComment_parentId_idx" ON "BlogComment"("parentId");

-- ─── BlogMedia ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "BlogMedia" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "type" "BlogMediaType" NOT NULL,
  "url" TEXT NOT NULL,
  "altText" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BlogMedia_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BlogMedia_postId_fkey"
    FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "BlogMedia_postId_sortOrder_idx"
  ON "BlogMedia"("postId", "sortOrder");

-- ─── BlogCategory postsCount maintenance ─────────────────────────────────────

CREATE OR REPLACE FUNCTION public.refresh_blog_category_posts_count(p_category_id TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_category_id IS NULL THEN
    RETURN;
  END IF;
  UPDATE "BlogCategory"
  SET "postsCount" = (
    SELECT COUNT(*)::INTEGER
    FROM "BlogPost" bp
    WHERE bp."categoryId" = p_category_id
      AND bp."status" = 'PUBLISHED'::"BlogPostStatus"
      AND bp."deletedAt" IS NULL
  )
  WHERE "id" = p_category_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_blog_post_category_posts_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_blog_category_posts_count(OLD."categoryId");
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD."categoryId" IS DISTINCT FROM NEW."categoryId" THEN
      PERFORM public.refresh_blog_category_posts_count(OLD."categoryId");
    END IF;
    IF NEW."categoryId" IS DISTINCT FROM OLD."categoryId"
       OR NEW."status" IS DISTINCT FROM OLD."status"
       OR NEW."deletedAt" IS DISTINCT FROM OLD."deletedAt" THEN
      PERFORM public.refresh_blog_category_posts_count(NEW."categoryId");
    END IF;
    RETURN NEW;
  END IF;

  PERFORM public.refresh_blog_category_posts_count(NEW."categoryId");
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS blog_post_category_posts_count ON "BlogPost";
CREATE TRIGGER blog_post_category_posts_count
  AFTER INSERT OR UPDATE OF "categoryId", "status", "deletedAt" OR DELETE
  ON "BlogPost"
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_blog_post_category_posts_count();

-- Backfill postsCount for existing categories
UPDATE "BlogCategory" bc
SET "postsCount" = sub.cnt
FROM (
  SELECT bp."categoryId" AS id, COUNT(*)::INTEGER AS cnt
  FROM "BlogPost" bp
  WHERE bp."categoryId" IS NOT NULL
    AND bp."status" = 'PUBLISHED'::"BlogPostStatus"
    AND bp."deletedAt" IS NULL
  GROUP BY bp."categoryId"
) sub
WHERE bc."id" = sub.id;

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE "BlogPostVersion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BlogComment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BlogMedia" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published_blog_posts" ON "BlogPost";
CREATE POLICY "public_read_published_blog_posts"
  ON "BlogPost"
  FOR SELECT
  TO anon, authenticated
  USING ("published" = true AND "deletedAt" IS NULL);

DROP POLICY IF EXISTS "public_read_blog_categories" ON "BlogCategory";
CREATE POLICY "public_read_blog_categories"
  ON "BlogCategory"
  FOR SELECT
  TO anon, authenticated
  USING ("isActive" = true);

DROP POLICY IF EXISTS "public_read_blog_post_tags" ON "BlogPostTag";
CREATE POLICY "public_read_blog_post_tags"
  ON "BlogPostTag"
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "BlogPost" bp
      WHERE bp.id = "BlogPostTag"."postId"
        AND bp."published" = true
        AND bp."deletedAt" IS NULL
    )
  );

CREATE POLICY "public_read_approved_blog_comments"
  ON "BlogComment"
  FOR SELECT
  TO anon, authenticated
  USING (
    "isApproved" = true
    AND EXISTS (
      SELECT 1 FROM "BlogPost" bp
      WHERE bp.id = "BlogComment"."postId"
        AND bp."published" = true
        AND bp."deletedAt" IS NULL
    )
  );

CREATE POLICY "public_read_blog_media_published_posts"
  ON "BlogMedia"
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "BlogPost" bp
      WHERE bp.id = "BlogMedia"."postId"
        AND bp."published" = true
        AND bp."deletedAt" IS NULL
    )
  );

CREATE POLICY "admin_all_blog_post_versions"
  ON "BlogPostVersion"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "admin_all_blog_comments"
  ON "BlogComment"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "admin_all_blog_media"
  ON "BlogMedia"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
