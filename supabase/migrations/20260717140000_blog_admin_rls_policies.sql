-- Add missing admin RLS policies for blog tables
-- Fixes: admin queries to BlogCategory, BlogPost, BlogTag, BlogPostTag blocked by RLS

DROP POLICY IF EXISTS "admin_all_blog_posts" ON "BlogPost";
CREATE POLICY "admin_all_blog_posts"
  ON "BlogPost"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_all_blog_categories" ON "BlogCategory";
CREATE POLICY "admin_all_blog_categories"
  ON "BlogCategory"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_all_blog_tags" ON "BlogTag";
CREATE POLICY "admin_all_blog_tags"
  ON "BlogTag"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_all_blog_post_tags" ON "BlogPostTag";
CREATE POLICY "admin_all_blog_post_tags"
  ON "BlogPostTag"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
