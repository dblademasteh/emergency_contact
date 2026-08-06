-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "office" TEXT NOT NULL,
    "unitCode" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_unitCode_key" ON "users"("unitCode");
