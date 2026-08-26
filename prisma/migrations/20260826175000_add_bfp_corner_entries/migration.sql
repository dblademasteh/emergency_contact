-- CreateTable
CREATE TABLE "bfp_corner_entries" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "youtubeUrl" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bfp_corner_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bfp_corner_entries_sortOrder_idx" ON "bfp_corner_entries"("sortOrder");
