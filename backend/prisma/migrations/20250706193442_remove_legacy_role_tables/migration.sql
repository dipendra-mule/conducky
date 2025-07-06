/*
  Warnings:

  - You are about to drop the `OrganizationMembership` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Role` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserEventRole` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "OrganizationMembership" DROP CONSTRAINT "OrganizationMembership_createdById_fkey";

-- DropForeignKey
ALTER TABLE "OrganizationMembership" DROP CONSTRAINT "OrganizationMembership_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "OrganizationMembership" DROP CONSTRAINT "OrganizationMembership_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserEventRole" DROP CONSTRAINT "UserEventRole_eventId_fkey";

-- DropForeignKey
ALTER TABLE "UserEventRole" DROP CONSTRAINT "UserEventRole_roleId_fkey";

-- DropForeignKey
ALTER TABLE "UserEventRole" DROP CONSTRAINT "UserEventRole_userId_fkey";

-- DropTable
DROP TABLE "OrganizationMembership";

-- DropTable
DROP TABLE "Role";

-- DropTable
DROP TABLE "UserEventRole";
