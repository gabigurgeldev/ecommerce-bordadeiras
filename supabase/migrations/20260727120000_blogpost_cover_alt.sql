-- Persist the cover image alt text.
--
-- The blog editor already had a "texto alternativo" field, but it was never
-- part of the save payload and the column did not exist, so whatever was typed
-- was discarded and every cover fell back to the post title as its alt.

ALTER TABLE "BlogPost"
  ADD COLUMN IF NOT EXISTS "coverAlt" TEXT;
