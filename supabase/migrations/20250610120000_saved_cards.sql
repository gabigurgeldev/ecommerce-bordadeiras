CREATE TABLE "SavedCard" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "mpCardId" TEXT NOT NULL,
  "lastFourDigits" TEXT,
  "brand" TEXT,
  "expirationMonth" INTEGER,
  "expirationYear" INTEGER,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SavedCard_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SavedCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "SavedCard_userId_idx" ON "SavedCard"("userId");

ALTER TABLE "SavedCard" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_manage_own_saved_cards"
  ON "SavedCard"
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u.id = "SavedCard"."userId" AND u."authUserId" = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u.id = "SavedCard"."userId" AND u."authUserId" = auth.uid()
    )
  );
