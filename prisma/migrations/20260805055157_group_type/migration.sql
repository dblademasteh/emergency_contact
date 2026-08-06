-- AlterTable
ALTER TABLE "groups" ADD COLUMN     "type" "ContactType" NOT NULL DEFAULT 'OTHER';

-- CreateIndex
CREATE INDEX "groups_type_idx" ON "groups"("type");
