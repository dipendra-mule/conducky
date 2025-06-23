/*
  Warnings:

  - Made the column `scopeId` on table `UserRole` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "UserRole" ALTER COLUMN "scopeId" SET NOT NULL;
