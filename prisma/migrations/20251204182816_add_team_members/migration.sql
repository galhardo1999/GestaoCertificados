-- AlterTable
ALTER TABLE "users" ADD COLUMN     "masterUserId" TEXT;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_masterUserId_fkey" FOREIGN KEY ("masterUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
