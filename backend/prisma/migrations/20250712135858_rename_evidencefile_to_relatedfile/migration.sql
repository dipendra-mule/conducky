-- AlterTable
ALTER TABLE "RelatedFile" RENAME CONSTRAINT "EvidenceFile_pkey" TO "RelatedFile_pkey";

-- RenameForeignKey
ALTER TABLE "RelatedFile" RENAME CONSTRAINT "EvidenceFile_incidentId_fkey" TO "RelatedFile_incidentId_fkey";

-- RenameForeignKey
ALTER TABLE "RelatedFile" RENAME CONSTRAINT "EvidenceFile_uploaderId_fkey" TO "RelatedFile_uploaderId_fkey";
