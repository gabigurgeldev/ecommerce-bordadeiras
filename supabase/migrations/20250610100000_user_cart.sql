-- User cart persistence (server-side sync for logged-in users)

CREATE TABLE "CartItem" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "variantId" TEXT,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "slug" TEXT,
  "name" TEXT,
  "priceCents" INTEGER,
  "imageUrl" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CartItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "CartItem_user_product_variant_idx"
  ON "CartItem"("userId", "productId", COALESCE("variantId", ''));

CREATE INDEX "CartItem_userId_idx" ON "CartItem"("userId");

ALTER TABLE "CartItem" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_read_own_cart"
  ON "CartItem"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u.id = "CartItem"."userId" AND u."authUserId" = auth.uid()
    )
  );

CREATE POLICY "user_manage_own_cart"
  ON "CartItem"
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u.id = "CartItem"."userId" AND u."authUserId" = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u.id = "CartItem"."userId" AND u."authUserId" = auth.uid()
    )
  );
