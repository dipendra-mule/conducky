-- No-op migration: Legacy table cleanup moved to optional maintenance task
-- This migration was originally intended to remove legacy RBAC tables
-- but caused deployment issues due to existing data constraints.
-- 
-- The legacy tables remain in the database but are unused by the application.
-- All functionality works perfectly with the unified RBAC system.
-- 
-- Legacy table cleanup is now tracked in GitHub Issue #308

-- This migration intentionally does nothing
SELECT 1; 