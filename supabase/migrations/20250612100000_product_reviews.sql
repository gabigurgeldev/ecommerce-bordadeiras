CREATE TYPE "ReviewSource" AS ENUM ('USER', 'AI');

CREATE TABLE "ProductReview" (
  id          TEXT PRIMARY KEY,
  "productId" TEXT NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  "userId"    TEXT REFERENCES "User"(id) ON DELETE SET NULL,
  "authorName" TEXT NOT NULL,
  text        TEXT NOT NULL,
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  "imageUrl"  TEXT,
  source      "ReviewSource" NOT NULL DEFAULT 'USER',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX product_review_user_once
  ON "ProductReview"("productId", "userId") WHERE "userId" IS NOT NULL;

CREATE INDEX product_review_product_idx ON "ProductReview"("productId", "createdAt" DESC);

ALTER TABLE "ProductReview" ENABLE ROW LEVEL SECURITY;
