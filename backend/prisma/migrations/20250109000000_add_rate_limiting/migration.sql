-- CreateTable
CREATE TABLE "RateLimit" (
    "id" SERIAL NOT NULL,
    "identifier" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RateLimit_identifier_endpoint_windowStart_key" ON "RateLimit"("identifier", "endpoint", "windowStart");

-- CreateIndex
CREATE INDEX "RateLimit_identifier_endpoint_idx" ON "RateLimit"("identifier", "endpoint");

-- CreateIndex
CREATE INDEX "RateLimit_windowStart_idx" ON "RateLimit"("windowStart");
