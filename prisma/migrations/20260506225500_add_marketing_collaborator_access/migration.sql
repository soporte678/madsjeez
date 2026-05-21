-- CreateEnum
CREATE TYPE "MarketingAccessLevel" AS ENUM ('FULL', 'READ_ONLY');

-- CreateTable
CREATE TABLE "marketing_collaborator_accesses" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "collaborator_email" TEXT NOT NULL,
    "access_level" "MarketingAccessLevel" NOT NULL DEFAULT 'READ_ONLY',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_collaborator_accesses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "marketing_collaborator_accesses_owner_id_collaborator_email_key"
ON "marketing_collaborator_accesses"("owner_id", "collaborator_email");

CREATE INDEX "marketing_collaborator_accesses_collaborator_email_is_active_idx"
ON "marketing_collaborator_accesses"("collaborator_email", "is_active");

-- AddForeignKey
ALTER TABLE "marketing_collaborator_accesses"
ADD CONSTRAINT "marketing_collaborator_accesses_owner_id_fkey"
FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
