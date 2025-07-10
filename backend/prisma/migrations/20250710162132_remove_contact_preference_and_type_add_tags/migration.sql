/*
  Warnings:

  - You are about to drop the column `contactPreference` on the `Incident` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Incident` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Incident" DROP COLUMN "contactPreference",
DROP COLUMN "type";

-- DropEnum
DROP TYPE "ContactPreference";

-- DropEnum
DROP TYPE "IncidentType";

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentTag" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentTag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Tag_eventId_idx" ON "Tag"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_eventId_name_key" ON "Tag"("eventId", "name");

-- CreateIndex
CREATE INDEX "IncidentTag_incidentId_idx" ON "IncidentTag"("incidentId");

-- CreateIndex
CREATE INDEX "IncidentTag_tagId_idx" ON "IncidentTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "IncidentTag_incidentId_tagId_key" ON "IncidentTag"("incidentId", "tagId");

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentTag" ADD CONSTRAINT "IncidentTag_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentTag" ADD CONSTRAINT "IncidentTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
