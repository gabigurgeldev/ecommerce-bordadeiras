-- Mirror supabase/migrations/20250604100000_fase2_auth_storage.sql (User.authUserId)
-- Apply Supabase SQL first, then: npx --yes prisma@6 migrate resolve --applied 20250604100000_auth_user_id

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "authUserId" UUID UNIQUE;
CREATE INDEX IF NOT EXISTS "User_authUserId_idx" ON "User"("authUserId");
