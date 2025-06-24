-- DropForeignKey
ALTER TABLE "EventInviteLink" DROP CONSTRAINT "EventInviteLink_roleId_fkey";

-- AddForeignKey
ALTER TABLE "EventInviteLink" ADD CONSTRAINT "EventInviteLink_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "UnifiedRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
