-- CreateTable
CREATE TABLE "contact_types" (
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'slate',
    "icon" TEXT NOT NULL DEFAULT 'more',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_types_pkey" PRIMARY KEY ("value")
);

-- Seed the default category pills
INSERT INTO "contact_types" ("value", "label", "color", "icon", "sortOrder", "isDefault", "createdAt", "updatedAt") VALUES
  ('EMERGENCY', 'Emergency', 'rose', 'siren', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('POLICE', 'Police', 'blue', 'shield', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('FIRE', 'Fire', 'orange', 'flame', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('MEDICAL', 'Medical', 'emerald', 'cross', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('FAMILY', 'Family', 'violet', 'users', 4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('UTILITY', 'Utility', 'amber', 'zap', 5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('OTHER', 'Other', 'slate', 'more', 6, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Convert the enum columns to plain text (values are already the enum member names)
ALTER TABLE "contacts" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "contacts" ALTER COLUMN "type" TYPE TEXT USING "type"::text;
ALTER TABLE "contacts" ALTER COLUMN "type" SET DEFAULT 'OTHER';

ALTER TABLE "groups" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "groups" ALTER COLUMN "type" TYPE TEXT USING "type"::text;
ALTER TABLE "groups" ALTER COLUMN "type" SET DEFAULT 'OTHER';

-- Add foreign keys so a type can only be deleted after its rows are reassigned
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_type_fkey" FOREIGN KEY ("type") REFERENCES "contact_types"("value") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "groups" ADD CONSTRAINT "groups_type_fkey" FOREIGN KEY ("type") REFERENCES "contact_types"("value") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Drop the now-unused enum
DROP TYPE "ContactType";
