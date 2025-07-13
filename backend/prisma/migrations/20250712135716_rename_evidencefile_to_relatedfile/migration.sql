-- Rename table
ALTER TABLE "EvidenceFile" RENAME TO "RelatedFile";

-- Rename foreign key in RelatedFile (if needed, Postgres auto-renames, but for clarity):
-- No column renames needed in RelatedFile, as columns are generic (incidentId, filename, etc.)

-- Update the relation in Incident (the join is by model, not by a join table, so no join table rename needed)
-- If there are any indexes or constraints with the old name, rename them (example below):
-- (You may need to check your DB for the exact constraint/index names if they were custom-named)

-- Example: ALTER INDEX "EvidenceFile_pkey" RENAME TO "RelatedFile_pkey";
-- Example: ALTER INDEX "EvidenceFile_incidentId_idx" RENAME TO "RelatedFile_incidentId_idx";

-- If you have a foreign key constraint from RelatedFile.incidentId to Incident.id, rename it:
-- (Replace with actual constraint name if different)
-- ALTER TABLE "RelatedFile" RENAME CONSTRAINT "EvidenceFile_incidentId_fkey" TO "RelatedFile_incidentId_fkey";

-- No data is lost; this is a pure rename migration.