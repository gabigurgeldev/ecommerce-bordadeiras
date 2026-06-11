-- Customer activity tracking (logged-in users)

CREATE TYPE "CustomerActivityType" AS ENUM (
    'PAGE_VIEW',
    'PRODUCT_VIEW',
    'ADD_TO_CART',
    'REMOVE_FROM_CART',
    'BEGIN_CHECKOUT',
    'SEARCH'
);

CREATE TABLE "CustomerActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "CustomerActivityType" NOT NULL,
    "path" TEXT,
    "productId" TEXT,
    "productName" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerActivity_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CustomerActivity_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "CustomerActivity_userId_createdAt_idx"
    ON "CustomerActivity"("userId", "createdAt" DESC);

ALTER TABLE "CustomerActivity" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_customeractivity" ON "CustomerActivity"
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
