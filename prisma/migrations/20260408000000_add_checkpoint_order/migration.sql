-- AlterTable
ALTER TABLE "Checkpoint" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;

-- Backfill: set order based on createdAt within each event
UPDATE "Checkpoint" c
SET "order" = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "eventId" ORDER BY "createdAt") - 1 AS rn
  FROM "Checkpoint"
) sub
WHERE c.id = sub.id;
