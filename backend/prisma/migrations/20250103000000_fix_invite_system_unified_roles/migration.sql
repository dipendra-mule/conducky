-- Migration: Fix invite system to use unified RBAC
-- This migration updates the EventInviteLink table to use UnifiedRole instead of legacy Role table

-- Step 1: Drop the existing foreign key constraint to legacy Role table
ALTER TABLE "EventInviteLink" DROP CONSTRAINT IF EXISTS "EventInviteLink_roleId_fkey";

-- Step 2: Update existing invite records to use unified role IDs
-- Map legacy role IDs to unified role IDs based on role names
UPDATE "EventInviteLink" 
SET "roleId" = (
    SELECT ur.id 
    FROM "UnifiedRole" ur 
    WHERE ur.name = CASE 
        WHEN (SELECT r.name FROM "Role" r WHERE r.id = "EventInviteLink"."roleId") = 'Reporter' THEN 'reporter'
        WHEN (SELECT r.name FROM "Role" r WHERE r.id = "EventInviteLink"."roleId") = 'Responder' THEN 'responder' 
        WHEN (SELECT r.name FROM "Role" r WHERE r.id = "EventInviteLink"."roleId") = 'Event Admin' THEN 'event_admin'
        WHEN (SELECT r.name FROM "Role" r WHERE r.id = "EventInviteLink"."roleId") = 'Admin' THEN 'event_admin'
        ELSE 'reporter' -- fallback
    END
    LIMIT 1
)
WHERE EXISTS (SELECT 1 FROM "Role" r WHERE r.id = "EventInviteLink"."roleId");

-- Step 3: Add foreign key constraint to UnifiedRole table  
ALTER TABLE "EventInviteLink" ADD CONSTRAINT "EventInviteLink_roleId_fkey" 
    FOREIGN KEY ("roleId") REFERENCES "UnifiedRole"("id") ON DELETE CASCADE ON UPDATE CASCADE; 