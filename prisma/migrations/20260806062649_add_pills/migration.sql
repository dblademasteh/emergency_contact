-- CreateTable
CREATE TABLE "pills" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dose" TEXT,
    "schedule" TEXT,
    "note" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pills_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pills_sortOrder_idx" ON "pills"("sortOrder");
