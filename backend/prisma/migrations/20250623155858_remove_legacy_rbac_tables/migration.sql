-- Remove foreign key constraints first
ALTER TABLE "UserEventRole" DROP CONSTRAINT IF EXISTS "UserEventRole_userId_fkey";
ALTER TABLE "UserEventRole" DROP CONSTRAINT IF EXISTS "UserEventRole_eventId_fkey";
ALTER TABLE "UserEventRole" DROP CONSTRAINT IF EXISTS "UserEventRole_roleId_fkey";

ALTER TABLE "EventInviteLink" DROP CONSTRAINT IF EXISTS "EventInviteLink_roleId_fkey";

ALTER TABLE "OrganizationMembership" DROP CONSTRAINT IF EXISTS "OrganizationMembership_organizationId_fkey";
ALTER TABLE "OrganizationMembership" DROP CONSTRAINT IF EXISTS "OrganizationMembership_userId_fkey";
ALTER TABLE "OrganizationMembership" DROP CONSTRAINT IF EXISTS "OrganizationMembership_createdById_fkey";

ALTER TABLE "OrganizationInviteLink" DROP CONSTRAINT IF EXISTS "OrganizationInviteLink_roleId_fkey" CASCADE;

-- Update EventInviteLink to reference UnifiedRole instead of Role
ALTER TABLE "EventInviteLink" ADD CONSTRAINT "EventInviteLink_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "UnifiedRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add roleId column to OrganizationInviteLink and update to reference UnifiedRole
ALTER TABLE "OrganizationInviteLink" ADD COLUMN "roleId" TEXT;

-- Update existing organization invite links to use unified role IDs
-- Map org_admin to the unified role
UPDATE "OrganizationInviteLink" SET "roleId" = (
  SELECT "id" FROM "UnifiedRole" WHERE "name" = 'org_admin'
) WHERE "role" = 'org_admin';

-- Map org_viewer to the unified role  
UPDATE "OrganizationInviteLink" SET "roleId" = (
  SELECT "id" FROM "UnifiedRole" WHERE "name" = 'org_viewer'
) WHERE "role" = 'org_viewer';

-- Make roleId NOT NULL after data migration
ALTER TABLE "OrganizationInviteLink" ALTER COLUMN "roleId" SET NOT NULL;

-- Add foreign key constraint for OrganizationInviteLink
ALTER TABLE "OrganizationInviteLink" ADD CONSTRAINT "OrganizationInviteLink_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "UnifiedRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Drop the old role column from OrganizationInviteLink
ALTER TABLE "OrganizationInviteLink" DROP COLUMN "role";

-- Drop legacy tables
DROP TABLE IF EXISTS "UserEventRole";
DROP TABLE IF EXISTS "OrganizationMembership";
DROP TABLE IF EXISTS "Role";

-- Drop legacy enum
DROP TYPE IF EXISTS "OrganizationRole"; 