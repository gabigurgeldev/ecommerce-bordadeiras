-- Phase 2: Supabase Auth + Storage policies + RLS for admin & public catalog
-- Target: self-hosted https://supabase.bordadeiras.cloud
-- Prisma/server routes continue using service_role / postgres (bypass RLS).
-- Browser client (@supabase/ssr) uses anon/authenticated + policies below.

-- ─── Link public.User ↔ auth.users ───────────────────────────────────────────

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "authUserId" UUID UNIQUE;

COMMENT ON COLUMN "User"."authUserId" IS
  'FK lógica para auth.users.id; preenchido pelo trigger ou script de migração.';

CREATE INDEX IF NOT EXISTS "User_authUserId_idx" ON "User"("authUserId");

-- ─── Admin helper (app_metadata.role — never user_metadata) ──────────────────

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN',
    false
  )
  OR EXISTS (
    SELECT 1
    FROM "User" u
    WHERE u."authUserId" = auth.uid()
      AND u.role = 'ADMIN'::"Role"
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- ─── Sync auth.users → public.User (optional, idempotent) ────────────────────

CREATE OR REPLACE FUNCTION public.handle_auth_user_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role "Role";
  v_name text;
BEGIN
  v_role := CASE
    WHEN COALESCE(NEW.raw_app_meta_data ->> 'role', '') = 'ADMIN' THEN 'ADMIN'::"Role"
    ELSE 'USER'::"Role"
  END;
  v_name := COALESCE(
    NEW.raw_user_meta_data ->> 'name',
    NEW.raw_user_meta_data ->> 'full_name',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO "User" (
    id,
    email,
    name,
    "emailVerified",
    role,
    "authUserId",
    "createdAt",
    "updatedAt"
  )
  VALUES (
    -- Prisma cuid() ids existentes permanecem; novos usuários Supabase Auth recebem id derivado do UUID
    replace(gen_random_uuid()::text, '-', ''),
    lower(trim(NEW.email)),
    v_name,
    NEW.email_confirmed_at,
    v_role,
    NEW.id,
    COALESCE(NEW.created_at, now()),
    now()
  )
  ON CONFLICT (email) DO UPDATE SET
    name            = COALESCE(EXCLUDED.name, "User".name),
    "emailVerified" = COALESCE(EXCLUDED."emailVerified", "User"."emailVerified"),
    "authUserId"    = EXCLUDED."authUserId",
    role            = CASE
                        WHEN EXCLUDED.role = 'ADMIN'::"Role" THEN 'ADMIN'::"Role"
                        ELSE "User".role
                      END,
    "updatedAt"     = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE OF email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data
  ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_sync();

-- ─── Storage buckets ─────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  8388608, -- 8 MiB (matches /api/uploads/direct)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'uploads',
  'uploads',
  false,
  8388608,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ─── Storage policies (storage.objects) ──────────────────────────────────────
-- service_role bypasses RLS — Prisma/admin API routes keep working server-side.

-- product-images: public read (storefront CDN-style URLs)
CREATE POLICY "product_images_public_read"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

CREATE POLICY "product_images_admin_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND public.is_admin()
  );

CREATE POLICY "product_images_admin_select"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND public.is_admin()
  );

CREATE POLICY "product_images_admin_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id = 'product-images'
    AND public.is_admin()
  );

CREATE POLICY "product_images_admin_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND public.is_admin()
  );

-- uploads: private bucket — admin only (INSERT needs SELECT+UPDATE for upsert)
CREATE POLICY "uploads_admin_select"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'uploads'
    AND public.is_admin()
  );

CREATE POLICY "uploads_admin_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'uploads'
    AND public.is_admin()
  );

CREATE POLICY "uploads_admin_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'uploads'
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id = 'uploads'
    AND public.is_admin()
  );

CREATE POLICY "uploads_admin_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'uploads'
    AND public.is_admin()
  );

-- ─── Table RLS: public catalog read ──────────────────────────────────────────

CREATE POLICY "public_read_active_products"
  ON "Product"
  FOR SELECT
  TO anon, authenticated
  USING (active = true AND status = 'ACTIVE'::"ProductStatus");

CREATE POLICY "public_read_product_images"
  ON "ProductImage"
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM "Product" p
      WHERE p.id = "ProductImage"."productId"
        AND p.active = true
        AND p.status = 'ACTIVE'::"ProductStatus"
    )
  );

CREATE POLICY "public_read_active_categories"
  ON "Category"
  FOR SELECT
  TO anon, authenticated
  USING (active = true);

CREATE POLICY "public_read_active_banners"
  ON "StorefrontBanner"
  FOR SELECT
  TO anon, authenticated
  USING (active = true);

CREATE POLICY "public_read_active_trust_items"
  ON "StorefrontTrustItem"
  FOR SELECT
  TO anon, authenticated
  USING (active = true);

CREATE POLICY "public_read_published_blog_posts"
  ON "BlogPost"
  FOR SELECT
  TO anon, authenticated
  USING (published = true);

CREATE POLICY "public_read_blog_categories"
  ON "BlogCategory"
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "public_read_blog_tags"
  ON "BlogTag"
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "public_read_blog_post_tags"
  ON "BlogPostTag"
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "BlogPost" bp
      WHERE bp.id = "BlogPostTag"."postId" AND bp.published = true
    )
  );

-- ─── Table RLS: authenticated customer (own rows) ────────────────────────────

CREATE POLICY "user_read_own_profile"
  ON "User"
  FOR SELECT
  TO authenticated
  USING ("authUserId" = auth.uid());

CREATE POLICY "user_update_own_profile"
  ON "User"
  FOR UPDATE
  TO authenticated
  USING ("authUserId" = auth.uid())
  WITH CHECK ("authUserId" = auth.uid());

CREATE POLICY "user_read_own_addresses"
  ON "Address"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u.id = "Address"."userId" AND u."authUserId" = auth.uid()
    )
  );

CREATE POLICY "user_manage_own_addresses"
  ON "Address"
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u.id = "Address"."userId" AND u."authUserId" = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u.id = "Address"."userId" AND u."authUserId" = auth.uid()
    )
  );

CREATE POLICY "user_read_own_orders"
  ON "Order"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u.id = "Order"."userId" AND u."authUserId" = auth.uid()
    )
  );

CREATE POLICY "user_read_own_order_items"
  ON "OrderItem"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM "Order" o
      JOIN "User" u ON u.id = o."userId"
      WHERE o.id = "OrderItem"."orderId"
        AND u."authUserId" = auth.uid()
    )
  );

CREATE POLICY "user_read_own_notifications"
  ON "Notification"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u.id = "Notification"."userId" AND u."authUserId" = auth.uid()
    )
  );

CREATE POLICY "user_update_own_notifications"
  ON "Notification"
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u.id = "Notification"."userId" AND u."authUserId" = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u.id = "Notification"."userId" AND u."authUserId" = auth.uid()
    )
  );

-- ─── Table RLS: admin full access (authenticated + is_admin) ─────────────────
-- UPDATE requires SELECT policy on same role — admin policies use FOR ALL.

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'User', 'Account', 'VerificationToken', 'PasswordResetToken',
    'Address', 'Category', 'Product', 'ProductImage',
    'Coupon', 'Order', 'OrderItem', 'Payment', 'Tracking',
    'BlogCategory', 'BlogTag', 'BlogPost', 'BlogPostTag',
    'Notification', 'EmailTemplate', 'Setting',
    'StorefrontBanner', 'StorefrontTrustItem',
    'WhatsappRecipient', 'WhatsappSession', 'AuditLog'
  ]
  LOOP
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())',
      'admin_all_' || lower(replace(t, '"', '')),
      t
    );
  END LOOP;
END $$;
